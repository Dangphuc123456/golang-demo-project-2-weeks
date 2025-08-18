import React from "react";

function FailPage() {
  return (
    <div className="container mt-5" style={{ maxWidth: 480 }}>
      <div className="border rounded shadow-sm p-4 text-center">
        <div className="text-danger mb-3">
          <h2>❌ Thất bại!</h2>
        </div>
        <p>Đã xảy ra lỗi trong quá trình xác nhận tài khoản. Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.</p>
        <a href="/register" className="btn btn-danger mt-3 fw-bold">
          Quay lại đăng ký
        </a>
      </div>
    </div>
  );
}

export default FailPage;
