## Source Code of Xavier: Toward Better Coding Assistance in Authoring Tabular Data Wrangling Scripts

- `backend/`: The backend of Xavier.
- `frontend/`: The frontend of Xavier.

### Environment for reference

- Processor: 12th Gen Intel(R) Core(TM) i7-12700H   2.30 GHz
- RAM: 16 GB
- Operator System: Windows 11 64-bit, based on x64 processor
- Conda version: 23.11.0


### How to run the backend

- Register Groq API key from [this link](https://console.groq.com/). The API key starts with `gsk_`.
- Create a ".env" file at `backend/` directory. Input `GROQ_API_KEY = "gsk_......"` in the file.
- Install required packages. It is recommended to use a virtual environment like conda.

```bash

# At the root directory of the project
# Create a new environment named "xavier_prompt" and install required packages.
conda create -n xavier_prompt python=3.10.13 groq flask flask-cors python-dotenv typeguard=3.0.2
activate xavier_prompt

# Run the server:
cd backend
python server_main.py

```

### How to run the frontend

- If you are using Windows, please follow [this instruction](https://learn.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development) to enable the developer mode.
- Install required packages in the "xavier_prompt" environment. Note that "pip" should be used instead of "conda" for installing the packages.

```bash

# At the root directory of the project
# If you have not activated the environment:
activate xavier_prompt
cd frontend

# Set suitable registry if you encounter network issues. For instance in China, you can use the following commands:
# npm config set registry https://registry.npm.taobao.org/
# yarn config set registry https://registry.npm.taobao.org/
# pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# Install package in development mode. You will see "xavier" if you run "pip list" command.
pip install -e .
# Install jupyterlab and pandas. pip will install the latest version of jupyterlab (>4) and pandas (>2.2). You can run `jupyter --version` or `pip list` to check the version.
pip install jupyterlab pandas
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build

```

- Note: If you encounter any error during installation and want to reinstall the packages, remember to remove these files first.
  - `.yarn/*`
  - `node_modules/*`
  - `lib/*`
  - `xavier/labextension/*`
  - `xavier/_version.py`
  - `yarn.lock`
  - `tsconfig.tsbuildinfo`


- After the installation, you can run the frontend by running the following command:

```bash

# At the root directory of the project
cd demo
# If you have not activated the environment:
activate xavier_prompt
jupyter lab

```