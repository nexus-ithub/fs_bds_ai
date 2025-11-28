import { NextResponse } from "next/server";
import { BdConsultRequestModel } from "../../../models/bdconsult.model";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  console.log(searchParams);
  const page = Number(searchParams.get("page")) || 1;
  const size = Number(searchParams.get("size")) || 10;
  const result = await BdConsultRequestModel.getList(page, size);
  if (result) {
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json({ success: false, message: "조회 실패" }, { status: 400 });
}

export async function PUT(req: Request) {
  const { action, ids } = await req.json();
  if (action === "pending") {
    const result = await BdConsultRequestModel.updatePending(ids);
    if (result) {
      return NextResponse.json({success: true, message: "상담 대기 상태로 변경되었습니다."})
    }
    return NextResponse.json({ success: false, message: "상담 대기 처리 중 오류가 발생했습니다." }, { status: 400 });
  } else if (action === "complete") {
    const result = await BdConsultRequestModel.updateComplete(ids);
    if (result) {
      return NextResponse.json({success: true, message: "상담 완료 상태로 변경되었습니다."})
    }
    return NextResponse.json({ success: false, message: "상담 완료 처리 중 오류가 발생했습니다." }, { status: 400 });
  } else if (action === "delete") {
    const result = await BdConsultRequestModel.updateDelete(ids);
    if (result) {
      return NextResponse.json({success: true, message: "상담 요청이 삭제되었습니다."})
    }
    return NextResponse.json({ success: false, message: "삭제 중 오류가 발생했습니다." }, { status: 400 });
  }
}


