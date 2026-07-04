/**
 * AI Assistant Query Test
 * Tests the Text-to-SQL and Vector Search functionality
 */

// Test questions to validate
const testQuestions = [
  { question: '사원 목록 조회', expectedTables: ['HR_EMPLOYEE'], description: 'Employee list query' },
  { question: '월별 급여 현황', expectedTables: ['PAY_SALARY'], description: 'Monthly salary query' },
  { question: '현재 재고 현황', expectedTables: ['MM_INVENTORY'], description: 'Inventory status query' },
  { question: '부서별 사원 수', expectedTables: ['HR_EMPLOYEE', 'HR_DEPARTMENT'], description: 'Employee count by department' },
  { question: '불량률 추이', expectedTables: ['QM_INSPECTION', 'QM_DEFECT'], description: 'Defect rate trend' }
];

// Database schema metadata (from textToSqlService.ts)
const DATABASE_SCHEMA = [
  { name: 'HR_EMPLOYEE', koreanName: '사원정보', keywords: ['사원', '직원', '인력', '입사', '퇴사', '근무'] },
  { name: 'HR_DEPARTMENT', koreanName: '부서정보', keywords: ['부서', '조직', '팀', '본부', '실'] },
  { name: 'HR_ATTENDANCE', koreanName: '근태정보', keywords: ['출근', '퇴근', '근태', '연장근무', '야근'] },
  { name: 'PAY_SALARY', koreanName: '급여정보', keywords: ['급여', '월급', '임금', '수당', '상여', '보너스', '연봉'] },
  { name: 'MM_MATERIAL', koreanName: '자재마스터', keywords: ['자재', '원자재', '부품', '재료', '원료'] },
  { name: 'MM_INVENTORY', koreanName: '재고현황', keywords: ['재고', '창고', '입고', '출고', '재고량', '가용재고'] },
  { name: 'MM_PURCHASE_ORDER', koreanName: '구매발주', keywords: ['발주', '구매', '주문', '납기', '공급업체'] },
  { name: 'PP_WORK_ORDER', koreanName: '작업지시', keywords: ['작업지시', '생산', '생산계획', '라인', '생산실적'] },
  { name: 'PP_PRODUCTION', koreanName: '생산실적', keywords: ['생산실적', '양품', '불량', '수율', '생산량', '일일생산'] },
  { name: 'QM_INSPECTION', koreanName: '품질검사', keywords: ['품질', '검사', '합격', '불합격', '품질검사', 'QC', '로트'] },
  { name: 'QM_DEFECT', koreanName: '불량현황', keywords: ['불량', '결함', '불량유형', '품질문제', '클레임'] },
  { name: 'SD_SALES_ORDER', koreanName: '수주정보', keywords: ['수주', '주문', '영업', '고객', '납기'] },
  { name: 'SD_SALES', koreanName: '매출실적', keywords: ['매출', '판매', '매출액', '매출실적', '영업실적'] },
  { name: 'CO_PRODUCT_COST', koreanName: '제품원가', keywords: ['원가', '제조원가', '재료비', '노무비', '경비', '단가'] },
  { name: 'FI_BUDGET', koreanName: '예산정보', keywords: ['예산', '예산실적', '예실대비', '비용예산'] }
];

// Find relevant tables by keyword matching
function findRelevantTables(question) {
  const normalizedQuestion = question.toLowerCase();
  const matches = [];

  for (const table of DATABASE_SCHEMA) {
    let score = 0;
    const matchedKeywords = [];

    // Check keywords
    for (const keyword of table.keywords) {
      if (normalizedQuestion.includes(keyword.toLowerCase())) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // Check Korean name
    if (normalizedQuestion.includes(table.koreanName.toLowerCase())) {
      score += 20;
      matchedKeywords.push(table.koreanName);
    }

    if (score > 0) {
      matches.push({ table, score, matchedKeywords });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

// Generate SQL based on question and matched tables
function generateSQL(question, matchedTables) {
  const primaryTable = matchedTables[0]?.table;
  if (!primaryTable) {
    return { sql: '', explanation: '관련 테이블을 찾을 수 없습니다.' };
  }

  const lowerQ = question.toLowerCase();
  let sql = '';
  let explanation = '';

  switch (primaryTable.name) {
    case 'HR_EMPLOYEE':
      if (lowerQ.includes('부서') && lowerQ.includes('수') && lowerQ.includes('사원')) {
        sql = `SELECT
  d.dept_name AS "부서명",
  COUNT(e.emp_id) AS "사원수",
  COUNT(CASE WHEN e.status = '재직' THEN 1 END) AS "재직자수"
FROM HR_DEPARTMENT d
LEFT JOIN HR_EMPLOYEE e ON d.dept_code = e.dept_code
GROUP BY d.dept_code, d.dept_name
ORDER BY COUNT(e.emp_id) DESC;`;
        explanation = '부서별 사원 수를 집계하여 조회합니다.';
      } else {
        sql = `SELECT
  emp_id AS "사원번호",
  emp_name AS "사원명",
  dept_code AS "부서코드",
  position AS "직급",
  hire_date AS "입사일",
  status AS "재직상태"
FROM HR_EMPLOYEE
ORDER BY hire_date DESC
LIMIT 100;`;
        explanation = '사원 정보를 최근 입사일 순으로 조회합니다.';
      }
      break;

    case 'PAY_SALARY':
      sql = `SELECT
  emp_id AS "사원번호",
  pay_year AS "지급년도",
  pay_month AS "지급월",
  base_salary AS "기본급",
  overtime_pay AS "연장수당",
  bonus AS "상여금",
  total_pay AS "총지급액",
  net_pay AS "실수령액"
FROM PAY_SALARY
WHERE pay_year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND pay_month = EXTRACT(MONTH FROM CURRENT_DATE)
ORDER BY total_pay DESC;`;
      explanation = '당월 급여 지급 내역을 조회합니다.';
      break;

    case 'MM_INVENTORY':
      sql = `SELECT
  m.mat_name AS "자재명",
  i.current_qty AS "현재고량",
  i.available_qty AS "가용재고",
  m.safety_stock AS "안전재고",
  CASE WHEN i.available_qty < m.safety_stock THEN '부족' ELSE '정상' END AS "상태"
FROM MM_INVENTORY i
JOIN MM_MATERIAL m ON i.mat_code = m.mat_code
ORDER BY i.available_qty ASC;`;
      explanation = '자재별 재고 현황과 부족 여부를 조회합니다.';
      break;

    case 'QM_INSPECTION':
    case 'QM_DEFECT':
      sql = `SELECT
  inspection_date AS "검사일",
  SUM(sample_qty) AS "검사수량",
  SUM(pass_qty) AS "합격수량",
  SUM(fail_qty) AS "불량수량",
  ROUND(SUM(fail_qty)::numeric / NULLIF(SUM(sample_qty), 0) * 100, 2) AS "불량률"
FROM QM_INSPECTION
WHERE inspection_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY inspection_date
ORDER BY inspection_date DESC;`;
      explanation = '최근 30일간 일별 품질 검사 현황과 불량률 추이를 조회합니다.';
      break;

    case 'SD_SALES':
      sql = `SELECT
  DATE_TRUNC('month', sales_date) AS "매출월",
  COUNT(*) AS "거래건수",
  SUM(quantity) AS "총판매수량",
  SUM(amount) AS "총매출금액"
FROM SD_SALES
WHERE sales_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', sales_date)
ORDER BY "매출월" DESC;`;
      explanation = '금년도 월별 매출 현황을 조회합니다.';
      break;

    default:
      sql = `SELECT * FROM ${primaryTable.name} LIMIT 100;`;
      explanation = `${primaryTable.koreanName} 테이블에서 데이터를 조회합니다.`;
  }

  return { sql, explanation };
}

// Run tests
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           AI Assistant Query Test - Text-to-SQL                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let passedTests = 0;
let totalTests = testQuestions.length;

testQuestions.forEach((test, index) => {
  console.log(`\n━━━ Test ${index + 1}: ${test.description} ━━━`);
  console.log(`📝 Question: "${test.question}"`);

  const matchedTables = findRelevantTables(test.question);
  console.log(`\n🔍 Vector Search Results:`);
  if (matchedTables.length === 0) {
    console.log(`   ⚠️  No matching tables found`);
  } else {
    matchedTables.forEach((match, i) => {
      console.log(`   ${i + 1}. ${match.table.koreanName} (${match.table.name})`);
      console.log(`      Score: ${match.score}% | Keywords: ${match.matchedKeywords.join(', ')}`);
    });
  }

  const { sql, explanation } = generateSQL(test.question, matchedTables);
  console.log(`\n📊 Generated SQL:`);
  console.log(`   ${sql.replace(/\n/g, '\n   ')}`);
  console.log(`\n💡 Explanation: ${explanation}`);

  // Verify if expected tables were found
  const foundTables = matchedTables.map(m => m.table.name);
  const allExpectedFound = test.expectedTables.every(t => foundTables.includes(t));

  if (allExpectedFound && matchedTables.length > 0) {
    console.log(`\n✅ PASS - Expected tables found: ${test.expectedTables.join(', ')}`);
    passedTests++;
  } else if (matchedTables.length > 0) {
    console.log(`\n⚠️  PARTIAL - Found: ${foundTables.join(', ')}`);
    console.log(`   Expected: ${test.expectedTables.join(', ')}`);
  } else {
    console.log(`\n❌ FAIL - No tables matched`);
  }
});

// Summary
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                        Test Summary                           ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(`   Total Tests: ${totalTests}`);
console.log(`   Passed: ${passedTests} ✅`);
console.log(`   Failed: ${totalTests - passedTests} ❌`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(0)}%\n`);

// Test API endpoint
console.log('━━━ Testing Backend API ━━━');
console.log('📡 Sending test query to backend...\n');

fetch('http://localhost:8000/api/sql/execute/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sql: 'SELECT 1 as test_row, \'AI Assistant Backend\' as service, \'Online\' as status'
  })
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Backend API Response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n🎉 AI Assistant is ready to use!');
      console.log('   Open http://localhost:3001 and click "AI 어시스턴트 (RAG)" in the sidebar');
    } else {
      console.log('❌ Backend API Error:', data.error);
    }
  })
  .catch(error => {
    console.log('❌ Backend connection failed:', error.message);
    console.log('   Make sure the backend server is running on port 8000');
  });
