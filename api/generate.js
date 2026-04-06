const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Force load .env.local for local development
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SYSTEM_PROMPT = `너는 기업 및 브랜드 홍보 영상 숏폼 기획을 전문으로 하는 10년 차 베테랑 영상 편집자이자 콘텐츠 전략가야. 제공된 타임스탬프가 포함된 롱폼 스크립트를 분석해서, 숏폼(30초~1분 분량)으로 만들기 가장 좋은 핵심 하이라이트 구간들을 선정해 줘.

[추출 및 분류 가이드]
1. 분량 확보 (필수): 각 타임스탬프 구간은 컷편집을 위한 앞뒤 여유 공간(Pre-roll & Post-roll)을 고려하여 원본 영상 기준 최소 60초에서 최대 120초(2분) 분량으로 넉넉하게 잡을 것. 30초 미만의 짧은 구간 추출은 절대 지양할 것.
2. 카테고리 정의:
    - 핵심 요약: 영상 전체의 주제 의식이나 서론-본론-결론이 1분 내외로 함축된 구간.
    - 노하우: "어떻게(How-to)"에 대한 구체적인 팁, 방법론, 실용적인 정보가 포함된 구간.
    - 인사이트: 고정관념을 깨거나, 비즈니스 통찰, 트렌드 분석 등 새로운 관점이 뚜렷한 구간.
    - 뉴스: 통계 데이터, 사실 중심, 최신 소식 등 정보 밀도가 높은 구간.
    - 유머/공감: 시청자의 웃음을 유발하거나 정서적 공감을 이끌어내는 인간적인 구간.
    - 브랜드/서비스: 서비스의 강점, 기업의 가치관, 고객 후기 등 직접적인 홍보/소개 구간.

[작성 지침]
1. 추출 개수 (절대 규칙): 영상의 길이에 상관없이 무조건 최소 3개에서 최대 5개의 숏폼 기획안을 추출할 것. 반환하는 JSON 배열의 데이터 개수가 1개나 2개가 되어서는 절대 안 됨.
2. 맥락 맞춤형 카테고리 할당 (중복 허용): 반환하는 배열의 첫 번째(index 0) 객체는 무조건 '핵심 요약'이어야 함. 나머지 구간은 영상의 전반적인 성격(예: 정보성 강연, 예능 등)에 맞춰 특정 카테고리(예: 인사이트 3개, 혹은 유머/공감 2개 등)가 2개 이상 중복되어 할당되어도 무방함. 단, 동일한 카테고리가 중복 추출될 경우, 각 기획안은 서로 완전히 다른 대사 구간과 차별화된 메시지를 다루어야 하며 절대 서로 내용이 겹치거나 반복되어서는 안 됨.
3. on_screen_titles: 영상 첫 3초 화면 정중앙에 시선을 끌 오프닝 자막 베리에이션 5가지를 제안할 것. (기업/브랜드에 맞는 신뢰감 있는 톤을 유지하되, 클릭을 유도하는 트렌디한 문구를 1~2개 섞어서 구성할 것)
4. highlight_keywords: 자막 편집 시 강조하거나 해시태그(#)로 활용할 단어 3~5개를 추출할 것. 무조건 2~6자 이내의 짧은 '명사형' 단어로 압축하며, 시청자의 이목을 끄는 직관적인 단어(예: 칼퇴근, 노코드, 비용절감, 충격 등)를 우선 선정할 것.
5. script_snippet: 편집자가 맥락을 즉시 파악하도록 해당 구간의 실제 대사 첫 2~3문장을 추출하되, 읽기 편하도록 반드시 문장(온점) 단위로 줄바꿈하여 제공할 것.
6. edit_guide: 편집자가 실무에서 직접 체크하며 작업할 수 있도록 [효과음/BGM, 컷편집/호흡, 화면/자막 모션] 3가지 영역으로 나누어, 당장 적용할 수 있는 구체적인 팁을 국문으로 1개씩 작성할 것. (영문 표기 제외)
7. Format: 모든 결과물은 한국어이며, 반드시 아래의 JSON 배열 형식으로만 대답할 것.

[반환 JSON 규격 예시]
[
  {
    "id": 1,
    "timestamp": "02:15 - 03:05",
    "category": "핵심 요약",
    "script_snippet": "결국 기술 도입보다 중요한 건 구성원들의 마인드셋입니다.\\n아무리 좋은 툴을 가져와도 본질을 모르면 소용이 없어요.",
    "on_screen_titles": [
      "좋은 툴보다 중요한 '이것'",
      "도입 실패하는 회사의 특징",
      "성공하는 조직의 마인드셋",
      "기술 도입, 착각하지 마세요",
      "진짜 효율은 여기서 나옵니다"
    ],
    "highlight_keywords": ["#마인드셋", "#조직문화", "#효율200%"],
    "edit_guide": {
      "sound_effect": "도입부에 묵직한 베이스의 '우웅' 하는 타격음을 넣어 집중도를 높이세요.",
      "cut_edit": "'아무리 좋은 툴을 가져와도' 대사 직후 0.5초의 정적(퍼즈)을 주어 긴장감을 만드세요.",
      "visual_effect": "화자의 얼굴로 서서히 줌인하면서 화면 테두리에 옅은 비네팅(어두움) 효과를 주어 진중함을 강조하세요."
    }
  }
]`;

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { scriptText } = req.body;
  if (!scriptText || typeof scriptText !== 'string' || scriptText.trim().length === 0) {
    return res.status(400).json({ error: '스크립트 내용이 비어있습니다.' });
  }

  // --- DEBUGGING LOGS --- //
  console.log('[generate] All keys in process.env:', Object.keys(process.env).join(', '));
  const rawKey = process.env.OPENAI_API_KEY;
  console.log('[generate] OPENAI_API_KEY exists?', !!rawKey, rawKey ? `(Length: ${rawKey.length}, Starts with: ${rawKey.substring(0, 5)})` : '');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[generate] API Key missing. Ensure .env.local is present.');
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  }

  try {
    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: scriptText.trim() },
      ],
      temperature: 0.7,
      // NOTE: response_format: json_object 는 배열 반환을 막으므로 사용하지 않음
    });

    const raw = completion.choices[0].message.content;

    // Remove markdown backticks if present
    let cleanedRaw = raw.trim();
    const match = cleanedRaw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      cleanedRaw = match[1].trim();
    } else if (cleanedRaw.startsWith('```')) {
      cleanedRaw = cleanedRaw.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    let parsed;
    try {
      const obj = JSON.parse(cleanedRaw);

      if (Array.isArray(obj)) {
        // 정상: GPT가 배열을 바로 반환한 경우
        parsed = obj;
      } else if (obj.result && Array.isArray(obj.result)) {
        parsed = obj.result;
      } else if (obj.data && Array.isArray(obj.data)) {
        parsed = obj.data;
      } else if (obj.plans && Array.isArray(obj.plans)) {
        parsed = obj.plans;
      } else if (typeof obj === 'object' && obj !== null) {
        // 숫자 키 객체 {"0":{...}, "1":{...}} 형태 처리
        const values = Object.values(obj);
        if (values.length > 0 && values.every(v => typeof v === 'object' && v !== null)) {
          parsed = values;
        } else {
          parsed = [obj];
        }
      } else {
        parsed = [];
      }
    } catch {
      return res.status(500).json({ error: 'AI 응답을 파싱하는 데 실패했습니다.', raw });
    }

    if (!Array.isArray(parsed)) {
      return res.status(500).json({ error: 'AI 응답 형식이 올바르지 않습니다.', raw });
    }

    return res.status(200).json({ data: parsed });
  } catch (err) {
    console.error('[generate] OpenAI error:', err);
    const message = err?.error?.message ?? err?.message ?? '알 수 없는 오류가 발생했습니다.';
    return res.status(500).json({ error: message });
  }
}
