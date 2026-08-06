# Step to create nodejs server api project

## Crawl Minh Ngọc into PostgreSQL

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Create the tables: `npm run db:migrate`.
3. Crawl a date range: `npm run crawl:minhngoc -- 2010-01-01 2010-01-10`.

The crawler waits one second between source requests, upserts a draw by date, and records failed dates in `crawl_runs`.

1. init project

- npm init

2. install dependencies

- npm i express cors dotenv mongo mongoose helmet morgan rotating-file-stream

3. install dev dependencies

- npm i --save-dev nodemon webpack webpack-cli @babel/core babel-loader webpack-node-externals @babel/preset-env
