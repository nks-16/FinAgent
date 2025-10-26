# Create virtualenv and install requirements (PowerShell)
python -m venv .venv
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
REM Ensure PyMuPDF installs as a prebuilt wheel on Windows (avoid source builds)
python -m pip install --only-binary=:all: PyMuPDF==1.24.14
python -m pip install -r requirements.txt
