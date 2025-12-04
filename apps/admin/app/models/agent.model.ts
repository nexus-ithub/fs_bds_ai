import { Agent } from "@repo/common";
import fs from 'fs';
import path from 'path';
import { trackError } from "../utils/analytics";

export class AgentModel {
  static async getSetting(): Promise<Agent> {
    try {
      console.log(process.cwd())
      const filePath = path.join(process.cwd(), 'app/main/agent/setting.json');  // TODO: 경로 확인
      console.log("filePath", filePath);

      const fileContents = fs.readFileSync(filePath, 'utf-8');
      const setting = JSON.parse(fileContents);

      return setting;
    } catch (error) {
      console.error('AgentModel.getSetting error:', error);
      trackError(error,{
        message: "Agent 설정 조회 중 오류가 발생했습니다.",
        file: "agent.model.ts",
        function: "getSetting",
        severity: "error"
      })
      throw error;
    }
  }
  
  static async update(agent: Agent): Promise<boolean> {
    try {
      console.log(process.cwd())
      const filePath = path.join(process.cwd(), 'app/main/agent/setting.json');  // TODO: 경로 확인
      console.log("filePath", filePath);

      const fileContents = fs.readFileSync(filePath, 'utf-8');
      const setting = JSON.parse(fileContents);

      const newSetting = {
        ...setting,
        ...agent,
      };

      fs.writeFileSync(filePath, JSON.stringify(newSetting, null, 2), 'utf-8');

      return true;
    } catch (error) {
      console.error('AgentModel.update error:', error);
      trackError(error,{
        message: "Agent 설정 수정 중 오류가 발생했습니다.",
        file: "agent.model.ts",
        function: "update",
        severity: "error"
      })
      throw error;
    }
  }
}
