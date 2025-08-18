HƯỚNG DẪN SỬ DỤNG TRƯỚC KHI DÙNG
Mở teminal chạy :
***GOLANG****
cd backend-
go mod tidy // tải tất cả package cần thiết
chạy bằng lệnh go run ./cmd/main.go
***REACT***
cd frontend-
npm install //để cài các thư viện đang dùng
chạy bằng lệnh npm run dev

***Các tài khoản đã đăng ký dùng được*** 
dangphucvghy195@gmail.com  quyền admin -mật khẩu 12345678
pvan585925@gmail.com       quyền technician -mật khẩu 12345678
pvan58592@gmail.com        quyền viewer -mật khẩu 12345678


***Trong .env của be điền DB_PASSWORD của mysql của bạn vào đó và tên db***
***DB mình tạo dùng sẵn đây***

-- Database: equipment_maintenance

CREATE DATABASE equipment_maintenance;
USE equipment_maintenance;

-- Table: suppliers
DROP TABLE IF EXISTS suppliers;
CREATE TABLE suppliers (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT INTO suppliers VALUES
(1,'Công ty TNHH Thiết Bị Công Nghiệp SamSung Vina','02812345678','contact@samsungvina.vn','Khu công nghiệp Tân Thuận, TP.HCM','2025-08-17 17:13:27'),
(2,'Công ty CP Thiết Bị Máy Móc Hoà Phát','02498765432','info@hoaphat.com.vn','Khu công nghiệp Hoà Phát, Hà Nội','2025-08-17 17:14:10'),
(3,'Công ty TNHH Thiết Bị Điện Tử Panasonic Việt Nam','02887654321','support@panasonic.com.vn','Khu công nghiệp Bình Dương, TP.HCM','2025-08-17 17:14:54'),
(4,'Công ty CP Thiết Bị Công Nghiệp Minh Việt','02411223344','sales@minhviet.vn','Khu công nghiệp Quế Võ,Bắc Bling','2025-08-17 17:16:02'),
(5,'Công ty TNHH Thiết Bị Cơ Khí Nam Việt','02855667788','info@namviet.com.vn','Khu công nghiệp Quận 3,TP.HCM','2025-08-17 17:16:57'),
(6,'Công ty CP Thiết Bị Máy Móc An Phát','02433445566','contact@anphat.com.vn','Thanh trì-Hà Nội','2025-08-17 17:17:35'),
(7,'Công ty TNHH Thiết Bị Tự Động Hóa VinFast','02899887766','automation@vinfast.vn','Khu công nghiệp Cát Lái, TP.HCM','2025-08-17 17:18:53'),
(8,'Công ty CP Thiết Bị Công Nghiệp Việt Nhật','02477889900','support@vietnhat.com.vn','Cầu Giấy,Hà Nội','2025-08-17 17:19:57');

-- Table: users
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','technician','viewer') DEFAULT 'viewer',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  email VARCHAR(100) DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  phone VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY username (username)
);

INSERT INTO users VALUES
(1,'Văn Phúc','$2a$10$oYN/q7lTczVKc2jgDN35BOOblv1kjiv7SXZGpEjvmB.kFEIekhDmy','admin','2025-08-17 16:41:54','dangphucvghy195@gmail.com','2025-08-17 16:44:35','0964505836'),
(2,'Nguyễn Nhật','$2a$10$usFuhtPXf.6EiKler6D1p.tWIayl05PFuKPnKifuO1qI3.iTDA5fa','technician','2025-08-17 16:43:35','pvan585923@gmail.com','2025-08-17 16:46:52','0987543322'),
(3,'Hán Hoàng','$2a$10$/9A/N4LKrWkRuazrJ/EADOaTjPCGSmGbYZ5anu/sZw8ovWN15u27e','technician','2025-08-17 16:46:20','pvan585925@gmail.com','2025-08-18 04:13:45','0987543323'),
(4,'HR','$2a$10$1msDUYuR109FnAkRDD68WeYAS24CE8SDgilGxZwUc96u707YVAAti','viewer','2025-08-18 04:07:47','pvan585922@gmail.com','2025-08-18 08:04:59','0985289442'),
(5,'Nguyễn Thành','$2a$10$n2xpnpZJd3y9zTmxzZ53UeI/Was/5HTAoeP/CKaPV/Rg/01TtupC6','viewer','2025-08-18 04:13:21','pvan58592@gmail.com','2025-08-18 08:05:02','0901234567');

-- Table: equipments
DROP TABLE IF EXISTS equipments;
CREATE TABLE equipments (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT NULL,
  purchase_date DATE DEFAULT NULL,
  status ENUM('active','inactive','maintenance') DEFAULT 'active',
  supplier_id INT DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  price DECIMAL(15,2) DEFAULT '0.00',
  PRIMARY KEY (id),
  KEY supplier_id (supplier_id),
  CONSTRAINT equipments_ibfk_1 FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL
);

INSERT INTO equipments VALUES
(1,'Máy trộn bột mì',NULL,'2025-08-17','active',4,'2025-08-17 17:30:26',14800000.00),
(2,'Lò nướng bánh mì đối lưu',NULL,'2025-08-17','active',4,'2025-08-17 17:31:14',32500000.00),
(3,'Tủ ủ bột 16 khay có điện',NULL,'2025-08-17','active',4,'2025-08-17 17:31:47',11500000.00),
(4,'Dây chuyền sản xuất bánh mì',NULL,'2025-08-17','active',4,'2025-08-17 17:32:24',62890000.00),
(6,'Băng truyền',NULL,'2025-08-18','active',1,'2025-08-18 07:47:01',200000000.00);

-- Table: maintenance_schedules
DROP TABLE IF EXISTS maintenance_schedules;
CREATE TABLE maintenance_schedules (
  id INT NOT NULL AUTO_INCREMENT,
  equipment_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  description TEXT,
  status ENUM('pending','completed') DEFAULT 'pending',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  technician_id INT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY equipment_id (equipment_id),
  KEY technician_id (technician_id),
  CONSTRAINT maintenance_schedules_ibfk_1 FOREIGN KEY (equipment_id) REFERENCES equipments (id) ON DELETE CASCADE,
  CONSTRAINT maintenance_schedules_ibfk_2 FOREIGN KEY (technician_id) REFERENCES users (id) ON DELETE SET NULL
);

INSERT INTO maintenance_schedules VALUES
(1,1,'2025-08-17','Kiểm tra trục quay của máy trộn bột mì','completed','2025-08-17 17:48:43',2);

-- Table: repair_history
DROP TABLE IF EXISTS repair_history;
CREATE TABLE repair_history (
  id INT NOT NULL AUTO_INCREMENT,
  repair_date DATE NOT NULL,
  issue_description TEXT,
  cost DECIMAL(10,2) DEFAULT NULL,
  technician_id INT DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  maintenance_id INT DEFAULT NULL,
  PRIMARY KEY (id),
  KEY technician_id (technician_id),
  KEY fk_repair_history_maintenance (maintenance_id),
  CONSTRAINT fk_repair_history_maintenance FOREIGN KEY (maintenance_id) REFERENCES maintenance_schedules (id),
  CONSTRAINT repair_history_ibfk_2 FOREIGN KEY (technician_id) REFERENCES users (id) ON DELETE SET NULL
);

INSERT INTO repair_history VALUES
(1,'2025-08-18','Trục máy bị hỏng vòng bi làm máy chạy bị đao',500000.00,2,'2025-08-17 10:49:57',1);


