## Xavier_Prompt

The backend of Xavier.

### How to run

- Register Groq API key from [this link](https://console.groq.com/)
- Create a ".env" file at the same directory as that of "Readme.md". Input `GROQ_API_KEY = "gsk_......"` in the file.
- Install required packages. It is recommended to use a virtual environment like conda.

```bash

conda create -n xavier_prompt python=3.10.13
activate xavier_prompt
conda install groq flask flask-cors python-dotenv typeguard

```

- Run the server:

```bash

activate xavier_prompt
python server_main.py

```