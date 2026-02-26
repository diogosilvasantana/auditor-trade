FROM node:20-alpine

WORKDIR /app

# OpenSSL required for Prisma schema-engine
RUN apk add --no-cache openssl libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./

# Install dependencies (bcryptjs is pure JS, no build tools needed)
RUN pnpm install --no-frozen-lockfile

COPY . .

# Generate Prisma and build NestJS app
RUN pnpm exec prisma generate
RUN pnpm build

EXPOSE 3001

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main"]

