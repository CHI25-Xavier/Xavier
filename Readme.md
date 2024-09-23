## Source Code of Xavier: Toward Better Coding Assistance in Authoring Tabular Data Wrangling Scripts

- `backend/`: The backend of Xavier.
- `frontend/`: The frontend of Xavier.

### How to run the backend

- Register Groq API key from [this link](https://console.groq.com/). The API key starts with `gsk_`.
- Create a ".env" file at `backend/` directory. Input `GROQ_API_KEY = "gsk_......"` in the file.
- Install required packages. It is recommended to use a virtual environment like conda.

```bash

conda create -n xavier_prompt python=3.10.13 groq flask flask-cors python-dotenv typeguard=3.0.2
activate xavier_prompt

# Run the server:
cd backend
python server_main.py

```