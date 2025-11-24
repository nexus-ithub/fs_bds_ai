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
    try{
      const testList = await axios.get(
        `${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/`,
        {
          headers: { 
            Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}`,
          },
        }
      )
      const result = testList.data.results;
      const wantedNames = [
        "(수정금지)bds_viewed",
        "(수정금지)ask_chat", 
        "(수정금지)report_viewed",
        "(수정금지)signup",
        "(수정금지)pageview"
      ];
      const insightMap = result.reduce((map: any, insight: any) => {
        if (wantedNames.includes(insight.name)) {
          map[insight.name] = insight.id;
        }
        return map;
      }, {});
      console.log("insightMap : ", insightMap)
    } catch(error) {
      console.log(error)
    }
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