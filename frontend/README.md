
# xavier

## Environment for reference

- Python 3.10.5
- JupyterLab 4.1.0
- Node.js 18.19.0
- npm 10.2.3
- yarn 1.22.19

## Building and Installing an Extension

- You will need NodeJS to build the extension package.
- It is recommended to turn off Clash for Windows and VPN and execute:

```bash
# If not set registry
npm config set registry https://registry.npm.taobao.org/
yarn config set registry https://registry.npm.taobao.org/
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```