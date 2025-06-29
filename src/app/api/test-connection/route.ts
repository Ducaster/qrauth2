import { NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

interface ConnectionStatus {
  environmentVariables: {
    GOOGLE_PRIVATE_KEY: string;
    GOOGLE_API_EMAIL: string;
    GOOGLE_SHEETS_ID: string;
  };
  apiConnection: string;
  sheetsAccess: string;
  sheets?: string[];
  error: string | null;
}

// Private Key 처리 함수
function processPrivateKey(key: string): string {
  // 이미 올바른 형식인 경우
  if (key.includes("-----BEGIN PRIVATE KEY-----")) {
    return key;
  }

  // JSON에서 추출된 키인 경우 (이스케이프된 문자 처리)
  let processedKey = key;

  // \n을 실제 줄바꿈으로 변환
  processedKey = processedKey.replace(/\\n/g, "\n");

  // BEGIN/END 마커가 없는 경우 추가
  if (!processedKey.includes("-----BEGIN PRIVATE KEY-----")) {
    processedKey = "-----BEGIN PRIVATE KEY-----\n" + processedKey;
  }
  if (!processedKey.includes("-----END PRIVATE KEY-----")) {
    processedKey = processedKey + "\n-----END PRIVATE KEY-----";
  }

  return processedKey;
}

export async function GET() {
  try {
    // 환경 변수 확인
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const email = process.env.GOOGLE_API_EMAIL;
    const sheetsId = process.env.GOOGLE_SHEETS_ID;

    const connectionStatus: ConnectionStatus = {
      environmentVariables: {
        GOOGLE_PRIVATE_KEY: key ? "✅ 설정됨" : "❌ 설정되지 않음",
        GOOGLE_API_EMAIL: email ? "✅ 설정됨" : "❌ 설정되지 않음",
        GOOGLE_SHEETS_ID: sheetsId ? "✅ 설정됨" : "❌ 설정되지 않음",
      },
      apiConnection: "테스트 중...",
      sheetsAccess: "테스트 중...",
      error: null,
    };

    // 환경 변수가 모두 설정되어 있는지 확인
    if (!key || !email || !sheetsId) {
      connectionStatus.apiConnection = "❌ 환경 변수 누락";
      connectionStatus.sheetsAccess = "❌ 환경 변수 누락";
      return NextResponse.json(connectionStatus, { status: 400 });
    }

    // Google Sheets API 연결 테스트
    try {
      // Private Key 처리
      const processedKey = processPrivateKey(key);

      const serviceAccountAuth = new JWT({
        key: processedKey,
        email: email,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const doc = new GoogleSpreadsheet(sheetsId, serviceAccountAuth);
      await doc.loadInfo();

      connectionStatus.apiConnection = "✅ 연결 성공";
      connectionStatus.sheetsAccess = "✅ 접근 가능";

      // 시트 목록 가져오기
      const sheetTitles = doc.sheetsByIndex.map((sheet) => sheet.title);
      connectionStatus.sheets = sheetTitles;
    } catch (apiError) {
      connectionStatus.apiConnection = "❌ 연결 실패";
      connectionStatus.sheetsAccess = "❌ 접근 실패";
      connectionStatus.error = (apiError as Error).message;
    }

    return NextResponse.json(connectionStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        environmentVariables: {
          GOOGLE_PRIVATE_KEY: "❌ 확인 불가",
          GOOGLE_API_EMAIL: "❌ 확인 불가",
          GOOGLE_SHEETS_ID: "❌ 확인 불가",
        },
        apiConnection: "❌ 오류 발생",
        sheetsAccess: "❌ 오류 발생",
        error: (error as Error).message,
      } as ConnectionStatus,
      { status: 500 }
    );
  }
}
