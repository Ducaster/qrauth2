"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

interface QrContextType {
  qrData: string | null;
  setQrData: (data: string) => void;
  selectedValue: string;
  handleSelectedValueChange: (value: string) => void;
}

const QrContext = createContext<QrContextType | undefined>(undefined);

export const QrProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");

  const handleSelectedValueChange = (value: string) => {
    setSelectedValue(value);
  };

  useEffect(() => {
    if (qrData) {
      if (selectedValue == "" || selectedValue == "add") {
        Swal.fire({
          icon: "warning",
          title: "시트를 선택해주세요",
          text: "데이터를 저장할 시트를 먼저 선택해주세요.",
          confirmButtonColor: "#f59e0b",
          confirmButtonText: "확인",
        });
        return;
      } else {
        Swal.fire({
          title: "데이터 인증 중...",
          text: "QR 코드 데이터를 처리하고 있습니다.",
          showConfirmButton: false,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        axios
          .post("./api/save", {
            data: qrData,
            selectedValue,
          })
          .then((response) => {
            if (response.status === 200) {
              Swal.fire({
                icon: "success",
                title: "인증 완료!",
                text: "QR 코드 데이터가 성공적으로 저장되었습니다.",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
              });

              // 성공 토스트 메시지
              toast.success("데이터 저장 완료", {
                position: toast.POSITION.TOP_CENTER,
                autoClose: 2000,
              });
            }
          })
          .catch((error) => {
            if (error.response?.status === 500) {
              Swal.fire({
                icon: "error",
                title: "데이터 인증 실패",
                text: "시트 헤더 형식을 확인해주세요. 올바른 컬럼명이 필요합니다.",
                confirmButtonColor: "#ef4444",
                confirmButtonText: "확인",
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "네트워크 오류",
                text: "서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
                confirmButtonColor: "#ef4444",
                confirmButtonText: "확인",
              });
            }

            // 오류 토스트 메시지
            toast.error("데이터 저장 실패", {
              position: toast.POSITION.TOP_CENTER,
              autoClose: 3000,
            });
          });
      }
    }
  }, [qrData, selectedValue]);

  return (
    <QrContext.Provider
      value={{ qrData, setQrData, selectedValue, handleSelectedValueChange }}
    >
      {children}
    </QrContext.Provider>
  );
};

export const useQrData = () => {
  const context = useContext(QrContext);
  if (context === undefined) {
    throw new Error("useQrData must be used within a QrProvider");
  }
  return context;
};
