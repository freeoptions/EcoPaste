# EcoPaste 项目规则

## Windows Release 交付

- Windows Release 构建成功后，只复制主程序 `EcoPaste.exe`。
- 使用 `scripts/copyExe.ts` 将主程序复制到 `D:\@Software\EcoPaste\EcoPaste.exe`。
- 不复制 `setup.exe` 或其他安装包到交付目录。
- 未确认 Release 构建成功前，不执行复制操作。
