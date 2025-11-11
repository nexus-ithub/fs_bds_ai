import { NextResponse } from "next/server";
import axios from 'axios'

export async function GET(req: Request) {
  try {
    console.log("posthog_key", process.env.POSTHOG_PERSONAL_KEY)
    console.log("posthog_project_id", process.env.POSTHOG_PROJECT_ID)
    console.log("posthog_host", process.env.POSTHOG_HOST)
    const reportResponse = await axios.post(`${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        insight: "TRENDS",
        events: [
          { id: "report_viewed", name: "report_viewed", type: "events", math: "total" }, // 리포트 조회 수
        ],
        interval: "day",
        date_from: "-6d",
        display: "ActionsLineGraph",
        breakdown: "region",
        properties: [],
        aggregation: "total"
      }, 
      {
        headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}` },
      },
    )
    const bdsResponse = await axios.post(`${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        insight: "TRENDS",
        events: [
          { id: "bds_viewed", name: "bds_viewed", type: "events", math: "total" }, // 빌딩샵 조회 수
        ],
        interval: "day",
        date_from: "-6d",
        display: "ActionsLineGraph",
        breakdown: "region",
        properties: [],
        aggregation: "total"
      }, 
      {
        headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}` },
      },
    )
    const graphResponse = await axios.post(`${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        insight: "TRENDS",
        events: [
          { id: "$pageview", name: "$pageview", type: "events", math: "dau" }, // 일간 사용자 수
          { id: "signup", name: "signup", type: "events", math: "total" }, // 신규 가입자 수
          { id: "ask_chat", name: "ask_chat", type: "events", math: "total" }, // AI 질의 수
        ],
        interval: "day",
        date_from: "-6d",
        display: "ActionsLineGraph",
        properties: [],
        aggregation: "total"
      }, 
      {
        headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}` },
      },
    )
    const countResponse = await axios.post(`${process.env.POSTHOG_HOST}/api/projects/${process.env.POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        insight: "TRENDS",
        events: [
          { id: "ask_chat", name: "ask_chat", type: "events", math: "total" }, // AI 질의 수
        ],
        interval: "day",
        date_from: "-6d",
        properties: [],
        aggregation: "total"
      }, 
      {
        headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_KEY}` },
      },
    )
    const combinedResult = {
      report: reportResponse.data.result,
      bds: bdsResponse.data.result,
      pageView: graphResponse.data.result[0],
      signup: graphResponse.data.result[1],
      askChat: countResponse.data.result[0],
    };
    return NextResponse.json(combinedResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
  }
} 