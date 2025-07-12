# Supabase Storage 삭제 문제 해결 가이드

## 문제 요약

**발생 현상**: Supabase Storage에서 파일 삭제 API가 성공 응답을 반환하지만 실제로는 파일이 삭제되지 않는 문제

**주요 증상**:
- `supabase.storage.from('bucket').remove([file])` 호출 시 `{data: [], error: null}` 반환
- 하지만 실제 파일은 여전히 브라우저에서 접근 가능한 상태로 남아있음
- 3단계 검증(삭제 전 확인 → 삭제 → 삭제 후 확인)에서 마지막 단계 실패

## 근본 원인

**Supabase Storage RLS(Row Level Security) 정책 부족**

Supabase Storage에서 파일 작업을 수행하려면 `storage.objects` 테이블에 대한 **완전한 CRUD 정책**이 모두 설정되어야 합니다. 많은 개발자들이 DELETE 정책만 누락되었다고 생각하지만, 실제로는 SELECT, INSERT, UPDATE, DELETE 정책이 **모두 필요**합니다.

## 해결 방법

### 1. 현재 정책 확인

```sql
-- 현재 설정된 storage.objects 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 2. 완전한 CRUD 정책 생성

```sql
-- SELECT 정책 (파일 조회/다운로드)
create policy "select_videos_bucket"
on storage.objects for select
to authenticated
using (bucket_id = 'videos');

-- INSERT 정책 (파일 업로드)  
create policy "insert_videos_bucket"
on storage.objects for insert
to authenticated
with check (bucket_id = 'videos');

-- UPDATE 정책 (파일 업데이트)
create policy "update_videos_bucket" 
on storage.objects for update
to authenticated
using (bucket_id = 'videos');

-- DELETE 정책 (파일 삭제)
create policy "delete_videos_bucket"
on storage.objects for delete  
to authenticated
using (bucket_id = 'videos');
```

### 3. 소유자 제한이 필요한 경우

```sql
-- 파일 소유자만 접근 가능하도록 제한
create policy "delete_videos_bucket_owner_only"
on storage.objects for delete  
to authenticated
using (bucket_id = 'videos' AND owner = auth.uid()::text);
```

## API 응답 패턴으로 문제 진단

### 정책 부족 시 (문제 상황)
```javascript
const { data, error } = await supabase.storage.from('videos').remove([filePath]);
console.log(data); // [] (빈 배열)
console.log(error); // null
```

### 정책 완료 시 (정상 상황)
```javascript
const { data, error } = await supabase.storage.from('videos').remove([filePath]);
console.log(data); // [{ name: 'filename', bucket_id: 'videos', owner: '...', ... }]
console.log(error); // null
```

**핵심**: API가 파일의 전체 메타데이터를 반환하면 정책이 올바르게 설정된 것입니다.

## 검증 방법

### 1. 3단계 검증 로직
```javascript
async function deleteStorageFile(fileUrl, bucketName, supabase) {
  // 1단계: 삭제 전 파일 존재 확인
  const { data: preCheck, error: preError } = await supabase.storage
    .from(bucketName)
    .download(filePath);
  
  if (preError) return true; // 파일이 없으면 삭제 성공으로 간주
  
  // 2단계: 파일 삭제 시도
  const { data: deleteData, error: deleteError } = await supabase.storage
    .from(bucketName)
    .remove([filePath]);
  
  // 3단계: 삭제 후 파일 접근 시도
  const { data: postCheck, error: postError } = await supabase.storage
    .from(bucketName)
    .download(filePath);
  
  // 삭제 성공 시 3단계에서 에러가 발생해야 함
  return !!postError;
}
```

### 2. 로그 분석
정책이 올바르게 설정되면 로그에서 다음과 같은 변화를 확인할 수 있습니다:

```
이전: data: []
이후: data: [{"name":"filename","bucket_id":"videos","owner":"user-id",...}]
```

## 참고 자료

- [GitHub Discussion #4133](https://github.com/orgs/supabase/discussions/4133)
- [GitHub Discussion #5786](https://github.com/orgs/supabase/discussions/5786)

## 주요 학습 사항

1. **완전한 정책 필요성**: DELETE 정책만으로는 부족하며, SELECT, INSERT, UPDATE, DELETE 모든 정책이 필요
2. **API 응답 패턴**: `data: []` vs `data: [메타데이터]`로 정책 상태 진단 가능
3. **커뮤니티 해결책**: 복잡한 서비스 이슈는 GitHub Discussion 등 커뮤니티에서 검증된 해결책 활용
4. **타입 캐스팅**: `auth.uid()::text` 형태로 UUID를 text로 변환하여 owner 필드와 비교

## 추가 팁

- 정책 생성 시 타입 캐스팅 오류가 발생하면 `owner = auth.uid()::text` 형태 사용
- 테스트 시에는 소유자 조건 없이 먼저 동작 확인 후 점진적으로 제한 추가
- 정책 변경 후에는 새로운 파일로 테스트하여 캐시 문제 배제