import React from "react";

function RegisterComplete() {
  return (
    <div className="container mt-5" style={{ maxWidth: 480 }}>
      <div className="border rounded shadow-sm p-4 text-center text-success">
        <h2>🎉 Thành công!</h2>
        <p>Xác nhận tài khoản thành công! Bạn có thể đăng nhập ngay.</p>
        <a href="/login" className="btn btn-primary mt-3 fw-bold">
          Đến trang đăng nhập
        </a>
      </div>
    </div>
  );
}

export default RegisterComplete;
