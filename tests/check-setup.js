#!/usr/bin/env node

/**
 * 고도화된 테스트 설정 확인 스크립트
 * 실행 방법: node tests/check-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SubTranslate 고도화된 테스트 설정 확인 중...\n');

// .env.local 파일 확인
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local 파일이 없습니다.');
    console.log('   .env.example을 복사해서 .env.local을 만들어주세요.\n');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// 필수 환경 변수 확인
const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': '✅ Supabase URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': '✅ Supabase Anon Key',
    'SUPABASE_SERVICE_ROLE_KEY': '🔑 Supabase Service Role Key (고도화된 테스트용)'
};

let allSet = true;

Object.entries(requiredVars).forEach(([varName, description]) => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (match && match[1] && match[1] !== 'your_service_role_key_here') {
        console.log(`✅ ${description}: 설정됨`);
    } else {
        console.log(`❌ ${description}: 설정 필요`);
        if (varName === 'SUPABASE_SERVICE_ROLE_KEY') {
            console.log('   → Supabase Dashboard → Settings → API → service_role 키를 복사하세요');
        }
        allSet = false;
    }
});

console.log('\n📋 설정 상태 요약:');

if (allSet) {
    console.log('🎉 모든 설정이 완료되었습니다!\n');
    
    console.log('🚀 이제 다음 명령어로 고도화된 테스트를 실행할 수 있습니다:');
    console.log('');
    console.log('   # 🔐 인증된 대시보드 테스트');
    console.log('   npm run test:advanced:auth');
    console.log('');
    console.log('   # ⚙️ 프로젝트 CRUD 테스트');
    console.log('   npm run test:advanced:crud');
    console.log('');
    console.log('   # 🎬 End-to-End 워크플로우');
    console.log('   npm run test:advanced:e2e');
    console.log('');
    console.log('   # 🚀 모든 고도화 테스트');
    console.log('   npm run test:advanced:all');
    console.log('');
    console.log('💡 팁: --slow-mo 값을 조정해서 관찰 속도를 변경할 수 있습니다.');
    
} else {
    console.log('⚠️ 일부 설정이 누락되었습니다.');
    console.log('   tests/SETUP-ADVANCED-TESTS.md 파일을 참고하여 설정을 완료해주세요.\n');
    
    console.log('📖 설정 가이드:');
    console.log('   1. Supabase Dashboard → Settings → API');
    console.log('   2. service_role 키 복사');
    console.log('   3. .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY 설정');
    console.log('   4. 다시 이 스크립트 실행: node tests/check-setup.js');
}

console.log('\n🔗 관련 파일:');
console.log('   • tests/SETUP-ADVANCED-TESTS.md - 상세 설정 가이드');
console.log('   • tests/ADVANCED-TESTING-GUIDE.md - 테스트 사용법');
console.log('   • .env.local - 환경 변수 설정');

console.log('\n' + '='.repeat(60));

// Playwright 설치 확인
try {
    require('@playwright/test');
    console.log('✅ Playwright 설치됨');
} catch (e) {
    console.log('❌ Playwright가 설치되지 않았습니다.');
    console.log('   npm install 명령어를 실행해주세요.');
    allSet = false;
}

// Supabase 클라이언트 확인
try {
    require('@supabase/supabase-js');
    console.log('✅ Supabase 클라이언트 설치됨');
} catch (e) {
    console.log('❌ Supabase 클라이언트가 설치되지 않았습니다.');
    allSet = false;
}

if (allSet) {
    console.log('\n🎯 모든 준비가 완료되었습니다! 고도화된 테스트를 시작하세요!');
} else {
    console.log('\n🔧 설정을 완료한 후 다시 확인해주세요.');
}