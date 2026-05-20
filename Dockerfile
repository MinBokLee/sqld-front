# 1단계: Node.js 환경에서 프론트엔드 소스코드 빌드
FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 파일 먼저 복사 및 설치 (캐싱 활용)
COPY package*.json ./
RUN npm install

# 전체 소스코드 복사 후 빌드 실행 (dist 또는 build 폴더 생성)
COPY . .
RUN npm run build

# 2단계: 빌드된 결과물(정적 파일)을 가벼운 Nginx 컨테이너에 담기
FROM nginx:alpine

# 1단계에서 빌드된 결과물만 Nginx의 웹 루트 경로로 복사
# (Vite/Vue는 dist, CRA/React는 build, Next.js export는 out 등 본인 빌드 폴더명에 맞게 수정)
COPY --from=builder /app/dist /usr/share/nginx/html

# 도커 컨테이너의 80번 포트를 열어줌
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]