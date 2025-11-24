import { NextResponse } from "next/server";
import axios from 'axios'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 2);
  const lastMonthStr = lastMonth.toISOString().split("T")[0];

  async function fetchInsight(id: string | undefined, overrideParams = {}) {
    if (!id) return null;

    const response = await axios.get(
      `${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/${id}/`,
      {
        headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}` },
        params: {
          refresh: "blocking",
          ...overrideParams,
        },
      }
    );

    return response.data.result;
  }

  if (action === "dashboard") {
    try {
      const [
        pageviewData,
        signupData,
        askChatData,
        bdsViewedData,
        reportViewedData,
      ] = await Promise.all([
        fetchInsight(process.env.PAGEVIEW_ID, { date_from: "-6d" }),
        fetchInsight(process.env.SIGNUP_ID, { date_from: "-6d" }),
        fetchInsight(process.env.ASK_CHAT_ID, { date_from: "-6d" }),
        fetchInsight(process.env.BDS_VIEWED_ID, { date_from: "-6d" }),
        fetchInsight(process.env.REPORT_VIEWED_ID, { date_from: "-6d" }),
      ]);

      const combinedResult = {
        report: reportViewedData,
        bds: bdsViewedData,
        pageView: pageviewData[0],
        signup: signupData[0],
        askChat: askChatData[0],
      };

      return NextResponse.json(combinedResult);
    } catch (error: any) {
      console.log(error)
      return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
    }
  } else if (action === "reportDetail") {
    try {
      const reportResponse = await axios.get(
      `${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/${process.env.REPORT_VIEWED_ID}/`,
        {
          headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}` },
          params: {
            refresh: "blocking",
            date_from: lastMonthStr,
            date_to: todayStr
          },
        }
      );
      return NextResponse.json(reportResponse.data.result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
    }
  } else if (action === "bdsDetail") {
    try {
      const bdsResponse = await axios.get(
      `${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/${process.env.BDS_VIEWED_ID}/`,
        {
          headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}` },
          params: {
            refresh: "blocking",
            date_from: lastMonthStr,
            date_to: todayStr
          },
        }
      );
      return NextResponse.json(bdsResponse.data.result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
    }
  }
} 

const PH = {
  host: process.env.POSTHOG_HOST!,
  projectId: process.env.POSTHOG_PROJECT_ID!,
  key: process.env.POSTHOG_PERSONAL_KEY!,
};

async function runQuery(query: any) {
  try {
    const res = await axios.post(`${PH.host}/api/projects/${PH.projectId}/query/`, { query }, {
      headers: { Authorization: `Bearer ${PH.key}` },
    });
    
    console.log('Raw response:', res.data);  // 성공 시: { results: [{ date: "...", count: 123 }, ...] }
    return res.data.results || res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('HTTP Status:', error.response?.status);
      console.error('Error Body:', error.response?.data);  // 다음 에러 대비
      console.error('Full Error:', error.message);
    }
    throw error;
  }
}

// // HogQL 쿼리 함수들 (TrendsQuery 에러 피함 – SQL로 직접 계산)
// export const getPageviewsDAU = () => runQuery({
//   kind: "HogQLQuery",
//   query: `
//     SELECT 
//       toDate(timestamp) AS date,
//       count(distinct person_id) AS dau
//     FROM events 
//     WHERE event = '$pageview' 
//       AND timestamp >= now() - INTERVAL 6 DAY
//     GROUP BY date 
//     ORDER BY date ASC
//   `,
// });

// export const getSignups = () => runQuery({
//   kind: "HogQLQuery",
//   query: `
//     SELECT 
//       toDate(timestamp) AS date,
//       count() AS count
//     FROM events 
//     WHERE event = 'signup' 
//       AND timestamp >= now() - INTERVAL 6 DAY
//     GROUP BY date 
//     ORDER BY date ASC
//   `,
// });

// export const getAskChat = () => runQuery({
//   kind: "HogQLQuery",
//   query: `
//     SELECT 
//       toDate(timestamp) AS date,
//       count() AS count
//     FROM events 
//     WHERE event = 'ask_chat' 
//       AND timestamp >= now() - INTERVAL 6 DAY
//     GROUP BY date 
//     ORDER BY date ASC
//   `,
// });

// export const getBdsViewedByRegion = () => runQuery({
//   kind: "HogQLQuery",
//   query: `
//     SELECT 
//       toDate(timestamp) AS date,
//       JSONExtractString(properties, 'region') AS region,
//       count() AS count
//     FROM events 
//     WHERE event = 'bds_viewed' 
//       AND timestamp >= now() - INTERVAL 6 DAY
//       AND JSONExtractString(properties, 'region') IS NOT NULL
//     GROUP BY date, region 
//     ORDER BY date ASC, region ASC
//   `,
// });

// export const getReportViewedByRegion = () => runQuery({
//   kind: "HogQLQuery",
//   query: `
//     SELECT 
//       toDate(timestamp) AS date,
//       JSONExtractString(properties, 'region') AS region,
//       count() AS count
//     FROM events 
//     WHERE event = 'report_viewed' 
//       AND timestamp >= now() - INTERVAL 6 DAY
//       AND JSONExtractString(properties, 'region') IS NOT NULL
//     GROUP BY date, region 
//     ORDER BY date ASC, region ASC
//   `,
// });