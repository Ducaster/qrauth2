import { NextRequest, NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { on } from "events";

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

// 구글 문서를 불러오는 함수
async function loadGoogleDoc() {
  try {
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const email = process.env.GOOGLE_API_EMAIL;
    const sheetsId = process.env.GOOGLE_SHEETS_ID;

    // 환경 변수 확인
    if (!key) {
      console.error("GOOGLE_PRIVATE_KEY 환경 변수가 설정되지 않았습니다.");
      throw new Error("GOOGLE_PRIVATE_KEY not found");
    }
    if (!email) {
      console.error("GOOGLE_API_EMAIL 환경 변수가 설정되지 않았습니다.");
      throw new Error("GOOGLE_API_EMAIL not found");
    }
    if (!sheetsId) {
      console.error("GOOGLE_SHEETS_ID 환경 변수가 설정되지 않았습니다.");
      throw new Error("GOOGLE_SHEETS_ID not found");
    }

    // Private Key 처리
    const processedKey = processPrivateKey(key);

    const serviceAccountAuth = new JWT({
      key: processedKey,
      email: email,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const doc = new GoogleSpreadsheet(sheetsId, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
  } catch (error) {
    console.error("Google Doc 로딩 실패:", error);
    throw error;
  }
}

export async function PUT(req: NextRequest) {
  const doc = await loadGoogleDoc();
  if (!doc) {
    return NextResponse.json(
      { error: "Internal Server Error(load Doc)" },
      { status: 500 }
    );
  }
  const body = req.body;
  if (!body) {
    console.log("Body is null");
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const processText = async () => {
    const reader = body.getReader();
    let result = "";
    let done, value;

    while ((({ done, value } = await reader.read()), !done)) {
      result += new TextDecoder("utf-8").decode(value);
    }

    return result;
  };

  const newSheet = JSON.parse(await processText());
  console.log(newSheet);

  let sheet = doc.sheetsByTitle[newSheet.sheetName];
  if (!sheet) {
    try {
      console.log("Create a new sheet");
      sheet = await doc.addSheet({
        headerValues: ["이름", "지역", "날짜", "시간"],
        title: newSheet.sheetName,
      });
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ success: true }, { status: 202 });
    }
  } else {
    // 기존 시트의 헤더 확인 (오류 발생 시 무시하고 진행)
    try {
      await sheet.loadHeaderRow();
      const headers = sheet.headerValues;
      const expectedHeaders = ["이름", "지역", "날짜", "시간"];

      if (!headers || headers.length === 0) {
        // 헤더가 없으면 헤더 추가
        await sheet.setHeaderRow(expectedHeaders);
      } else {
        // 헤더가 올바른지 확인
        const isValidHeaders = expectedHeaders.every(
          (header, index) => headers[index] === header
        );

        if (!isValidHeaders) {
          console.warn(
            "Sheet headers don't match expected format, but continuing..."
          );
        }
      }
    } catch (error) {
      console.warn(
        "Error checking sheet headers, continuing with data insertion:",
        (error as Error).message
      );
      // 헤더 확인 실패 시에도 계속 진행
    }
  }
}

export async function GET() {
  try {
    // 구글 문서를 불러옴
    const doc = await loadGoogleDoc();
    if (!doc) {
      return NextResponse.json(
        { error: "Internal Server Error(load Doc)" },
        { status: 500 }
      );
    }

    const sheetTitles = doc.sheetsByIndex.map((sheet) => sheet.title);

    return NextResponse.json(
      { success: true, data: sheetTitles },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error(import Data)" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 구글 문서를 불러옴
    const doc = await loadGoogleDoc();
    if (!doc) {
      return NextResponse.json(
        { error: "Internal Server Error(load Doc)" },
        { status: 500 }
      );
    }

    // NextRequest로부터 데이터를 가져옴
    const body = req.body;
    if (!body) {
      console.log("Body is null");
      return NextResponse.json({ erorr: "Bad Request" }, { status: 400 });
    }
    // 데이터를 텍스트로 변환
    const processText = async () => {
      const reader = body.getReader();
      let result = "";
      let done, value;

      while ((({ done, value } = await reader.read()), !done)) {
        result += new TextDecoder("utf-8").decode(value);
      }

      return result;
    };
    // 텍스트를 정리하고 json형식으로 변환
    const result = await processText();
    const jsonData = JSON.parse(result);
    const sheetdata = JSON.parse(jsonData.data);
    const sheetname = jsonData.selectedValue;

    // sheet이 있는지 확인하고, 없다면 생성
    let sheet = doc.sheetsByTitle[sheetname];
    if (!sheet) {
      console.log("Create a new sheet");
      sheet = await doc.addSheet({
        headerValues: ["이름", "지역", "날짜", "시간"],
        title: sheetname,
      });
    } else {
      // 기존 시트의 헤더 확인 (오류 발생 시 무시하고 진행)
      try {
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        const expectedHeaders = ["이름", "지역", "날짜", "시간"];

        if (!headers || headers.length === 0) {
          // 헤더가 없으면 헤더 추가
          await sheet.setHeaderRow(expectedHeaders);
        } else {
          // 헤더가 올바른지 확인
          const isValidHeaders = expectedHeaders.every(
            (header, index) => headers[index] === header
          );

          if (!isValidHeaders) {
            console.warn(
              "Sheet headers don't match expected format, but continuing..."
            );
          }
        }
      } catch (error) {
        console.warn(
          "Error checking sheet headers, continuing with data insertion:",
          (error as Error).message
        );
        // 헤더 확인 실패 시에도 계속 진행
      }
    }

    const rows = await sheet.getRows();
    let emptyRow = null;
    let targetRow = null;
    for (const row of rows) {
      if (
        !row.get("이름") &&
        !row.get("지역") &&
        !row.get("날짜") &&
        !row.get("시간")
      ) {
        emptyRow = row;
        targetRow = emptyRow.rowNumber;
        break;
      }
    }

    const formatDate = (date: Date) => {
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      return kstDate.toISOString().split("T")[0]; // YYYY-MM-DD 형식
    };

    const formatTime = (date: Date) => {
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      return kstDate.toISOString().split("T")[1].split(".")[0]; // HH:MM:SS 형식
    };

    /*
    const formatDate = (date: Date) => {
      // 한국 시간대로 조정
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

      const year = kstDate.getFullYear().toString();
      const month = (kstDate.getMonth() + 1).toString().padStart(2, "0");
      const day = kstDate.getDate().toString().padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const formatTime = (date: Date) => {
      // 한국 시간대로 조정
      const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

      const hour = kstDate.getHours().toString().padStart(2, "0");
      const minute = kstDate.getMinutes().toString().padStart(2, "0");
      const second = kstDate.getSeconds().toString().padStart(2, "0");

      return `${hour}:${minute}:${second}`;
    };
    */

    // 변환한 json형식대로 sheet에 추가
    if (!targetRow) {
      await sheet.addRow({
        이름: sheetdata.name,
        지역: sheetdata.region,
        날짜: formatDate(new Date()),
        시간: formatTime(new Date()),
      });
    } else if (targetRow) {
      const cellRange = `A${targetRow}:D${targetRow}`;
      console.log(cellRange);
      await sheet.loadCells(cellRange); // 해당 범위의 셀 로드
      sheet.getCell(targetRow - 1, 0).value = sheetdata.name;
      sheet.getCell(targetRow - 1, 1).value = sheetdata.region;
      sheet.getCell(targetRow - 1, 2).value = formatDate(new Date()).toString();
      sheet.getCell(targetRow - 1, 3).value = formatTime(new Date()).toString();
      await sheet.saveUpdatedCells(); // 변경된 셀을 저장
    }

    /*
    await sheet.addRow({
      이름: sheetdata.name,
      지역: sheetdata.region,
      날짜: formatDate(new Date()),
      시간: formatTime(new Date()),
    });
    */

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error(import Data)" },
      { status: 500 }
    );
  }
}
