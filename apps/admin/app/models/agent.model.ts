import { Agent } from "@repo/common";
import fs from 'fs';
import path from 'path';

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
      throw error;
    }
  }
}
