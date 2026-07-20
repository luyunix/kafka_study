# 笔记构建脚本

## `transcribe_course.py`

输入是由 Codex 内置浏览器从 B 站播放器读取到临时目录的 `pNNN-audio.m4s`；脚本使用
macOS `afconvert` 转成 16 kHz PCM，再调用 MLX Whisper 生成逐段时间戳 JSON。

```bash
/path/to/python scripts/transcribe_course.py \
  /tmp/kafka-course-media \
  /tmp/kafka-course-asr
```

需要 `numpy` 与 `mlx-whisper`。媒体文件只用于个人学习核查，不写入仓库。

## `build_notes.py`

输入浏览器读取的课程目录 JSON 和全部 ASR JSON，生成根目录、10 个章节、156 篇主笔记、
156 份原始转写和 156 张原创 SVG。

```bash
python scripts/build_notes.py \
  /tmp/kafka-course-media/course-catalog.json \
  /tmp/kafka-course-asr \
  --root .
```

生成完成后运行完整性检查：

```bash
python scripts/verify_notes.py
```
