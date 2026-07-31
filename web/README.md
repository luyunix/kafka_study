# Kafka Study GitHub Pages

这是课程学习站点的纯静态构建入口，复用仓库根目录的 `notes/`，并发布到：

<https://luyunix.github.io/kafka_study/>

本地构建：

```bash
cd web
npm ci
npm run build:pages
```

静态产物输出到 `web/out/`，由 GitHub Actions 发布，不提交生成目录。
