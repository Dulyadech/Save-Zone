# เลือก Python เวอร์ชันที่ต้องการ
FROM python:3.10.17-slim

# ตั้งค่าพื้นที่ทำงาน
WORKDIR /app

# คัดลอกไฟล์โปรเจกต์เข้ามาใน Docker image
COPY . .

# ติดตั้ง dependencies
RUN pip install --no-cache-dir -r requirements.txt

# ตั้งค่าเริ่มต้นให้รัน Flask app
CMD ["gunicorn", "main:app"]
