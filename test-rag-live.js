const { executeRAGPipeline } = require('./src/lib/rag-engine');

async function testRAG() {
  console.log('Testing RAG Engine on real Google Sheets Knowledge Base data...');
  
  const test1 = await executeRAGPipeline({ question: 'ช่องทางติดต่อวิทยาลัยการอาชีพฝางมีเบอร์โทรอะไรบ้าง', isPlayground: true });
  console.log('\n[Q1: ช่องทางติดต่อ]');
  console.log('Answer:\n', test1.answer);
  console.log('Confidence:', test1.confidence_score, 'Is Fallback:', test1.is_fallback);
  console.log('Sources Retrieved:', test1.sources);

  const test2 = await executeRAGPipeline({ question: 'คณะผู้บริหารวิทยาลัยการอาชีพฝางมีใครบ้าง', isPlayground: true });
  console.log('\n[Q2: ผู้บริหาร]');
  console.log('Answer:\n', test2.answer);
  console.log('Confidence:', test2.confidence_score, 'Is Fallback:', test2.is_fallback);
  console.log('Sources Retrieved:', test2.sources);

  const test3 = await executeRAGPipeline({ question: 'ครูสาขาช่างไฟฟ้ามีใครบ้าง', isPlayground: true });
  console.log('\n[Q3: ครูช่างไฟฟ้า]');
  console.log('Answer:\n', test3.answer);
  console.log('Confidence:', test3.confidence_score, 'Is Fallback:', test3.is_fallback);
  console.log('Sources Retrieved:', test3.sources);
}

testRAG();
