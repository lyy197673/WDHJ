FROM python:3.11.9-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    poppler-utils \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    fonts-wqy-microhei \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "import easyocr; easyocr.Reader(['ch_sim','en'], gpu=False)"

COPY app.py .

EXPOSE 7860

CMD ["python", "app.py"]
