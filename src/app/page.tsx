"use client";
import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useQrData } from "./importsheet";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";

export default function Qrscan() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<
    "idle" | "scanning" | "success" | "error"
  >("idle");
  const videoRef = useRef(null);
  const { setQrData, handleSelectedValueChange } = useQrData();
  const fixedSheetName = "교교QR인증";

  const QrOptions = {
    preferredCamera: "environnment",
    maxScansPerSecond: 15,
    highlightScanRegion: true,
  };

  const handleScan = (result: QrScanner.ScanResult) => {
    const parsedData = result.data;
    if (parsedData.includes("name")) {
      setQrData(parsedData);
      setScanStatus("success");
      toast.success("QR 코드 인증 성공!", {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 3000,
      });
      setTimeout(() => {
        setScanStatus("idle");
      }, 3000);
    } else {
      setScanStatus("error");
      toast.error("올바르지 않은 QR 코드입니다.", {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 3000,
      });
      setTimeout(() => {
        setScanStatus("idle");
      }, 2000);
    }
  };

  useEffect(() => {
    // 시트 고정값 전달
    handleSelectedValueChange(fixedSheetName);
    const videoElem = videoRef.current;
    if (videoElem) {
      setIsScanning(true);
      const qrScanner = new QrScanner(
        videoElem,
        (result) => handleScan(result),
        QrOptions
      );
      qrScanner.start();
      return () => {
        qrScanner.destroy();
        setIsScanning(false);
      };
    }
  }, []);

  return (
    <div className="min-h-screen h-screen w-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center p-0 m-0 overflow-hidden">
      {/* 헤더 */}
      <div className="w-full px-2 sm:px-8 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              QR 인증 시스템
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm">
              QR 코드를 스캔하여 인증하세요
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-0">
          <div
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
              isScanning ? "bg-green-400 animate-pulse" : "bg-red-400"
            }`}
          ></div>
          <span className="text-white text-xs sm:text-sm font-medium">
            {isScanning ? "카메라 활성화" : "카메라 비활성화"}
          </span>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center md:items-stretch justify-center gap-4 md:gap-8 px-2 sm:px-8 pb-4">
        {/* QR 스캐너 */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <div className="relative w-full h-[40vw] max-h-[70vh] max-w-2xl aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
            {/* 스캔 상태 오버레이 */}
            {scanStatus === "success" && (
              <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                    인증 완료!
                  </h3>
                  <p className="text-green-100 text-xs sm:text-base">
                    QR 코드가 성공적으로 인증되었습니다.
                  </p>
                </div>
              </div>
            )}
            {scanStatus === "error" && (
              <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                    인증 실패
                  </h3>
                  <p className="text-red-100 text-xs sm:text-base">
                    올바르지 않은 QR 코드입니다.
                  </p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            {/* 스캔 프레임 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 border-2 border-yellow-400 rounded-xl relative">
                {/* 코너 마커 */}
                <div className="absolute -top-1 -left-1 w-4 h-4 sm:w-6 sm:h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 sm:w-6 sm:h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></div>
              </div>
            </div>
            {/* 안내 텍스트 */}
            <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-medium">
                QR 코드를 프레임 안에 위치시켜주세요
              </div>
            </div>
          </div>
        </div>
        {/* 우측 패널 */}
        <div className="flex flex-col gap-4 md:gap-8 w-full max-w-xs md:max-w-sm mt-4 md:mt-0 flex-shrink-0">
          {/* 데이터 저장 설정 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              데이터 저장 설정
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-blue-100 mb-1 sm:mb-2">
                  저장할 시트
                </label>
                <input
                  type="text"
                  value={fixedSheetName}
                  readOnly
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/20 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm text-center font-bold text-base sm:text-lg cursor-default"
                />
              </div>
            </div>
          </div>
          {/* 시스템 상태 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
              시스템 상태
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-blue-100 text-xs sm:text-sm">
                카메라 상태
              </span>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
              <span className="text-white text-xs sm:text-sm font-medium">
                정상
              </span>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
