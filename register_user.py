import requests
import json

# URL dan data untuk pendaftaran
url = "http://localhost:8000/api/register"
user_data = {"email": "user@example.com", "password": "password123"}

# Kirim permintaan pendaftaran
try:
    response = requests.post(url, json=user_data)

    if response.status_code == 200:
        print("User berhasil didaftarkan:")
        print(json.dumps(response.json(), indent=2))

        # Mencoba login untuk mendapatkan token
        login_url = "http://localhost:8000/api/token"
        login_response = requests.post(
            login_url,
            json={"username": user_data["email"], "password": user_data["password"]},
        )

        if login_response.status_code == 200:
            print("\nLogin berhasil, token JWT:")
            print(json.dumps(login_response.json(), indent=2))
            print("\nGunakan token ini untuk autentikasi di frontend")
        else:
            print(f"\nLogin gagal: {login_response.status_code}")
            print(login_response.text)
    else:
        print(f"Pendaftaran gagal: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {str(e)}")
