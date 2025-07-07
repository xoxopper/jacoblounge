package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("super-secret-here")

type User struct {
	Name      string
	PublicKey *ecdsa.PublicKey
}

var users []User // Added bellow

type LoginRequest struct {
	Timestamp string `json:"timestamp"` // base64 encoded message (e.g., "1720175701")
	Signature string `json:"signature"` // base64 encoded signature
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	sigBytes, err := base64.StdEncoding.DecodeString(req.Signature)
	if err != nil {
		http.Error(w, "invalid signature", http.StatusBadRequest)
		return
	}
	rSig := new(big.Int).SetBytes(sigBytes[:32])
	sSig := new(big.Int).SetBytes(sigBytes[32:])

	// Parse the sentTimestamp from message
	timestampInt, err := strconv.ParseInt(req.Timestamp, 10, 64)
	if err != nil {
		http.Error(w, "invalid sentTimestamp", http.StatusBadRequest)
		return
	}
	sentTimestamp := time.Unix(timestampInt, 0)
	currentTimestamp := time.Now()

	if math.Abs(currentTimestamp.Sub(sentTimestamp).Seconds()) > 30 {
		http.Error(w, "sentTimestamp expired or in future", http.StatusUnauthorized)
		return
	}

	msgHash := sha256.Sum256([]byte(req.Timestamp))

	for _, user := range users {
		if ecdsa.Verify(user.PublicKey, msgHash[:], rSig, sSig) {
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"user": user.Name,
				"exp":  time.Now().Add(time.Hour).Unix(),
			})

			tokenStr, err := token.SignedString(jwtSecret)
			if err != nil {
				http.Error(w, "failed to sign token", http.StatusInternalServerError)
				return
			}

			http.SetCookie(w, &http.Cookie{
				Name:     "jwt_token",
				Value:    tokenStr,
				Path:     "/",
				Domain:   "jacoblounge.pt",
				HttpOnly: true,
				Secure:   true,
				SameSite: http.SameSiteNoneMode,
			})

			_, err = w.Write([]byte("Login successful\n"))
			if err != nil {
				return
			}
			return
		}
	}

	http.Error(w, "invalid signature", http.StatusUnauthorized)
}

func validateHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("jwt_token")
	if err != nil {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	tokenStr := cookie.Value
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	_, err = w.Write([]byte("Token is valid\n"))
	if err != nil {
		return
	}
}

func main() {

	/*
		var alexPubKey, errAlexPubKey = base64.StdEncoding.DecodeString("base64-public-key")
		if errAlexPubKey != nil {
			fmt.Println("Unable to load xoxopper public key")
		} else {
			users = append(users, User{
				Name:      "alex",
				PublicKey: alexPubKey,
			})
		}
	*/

	var xoxopperPubKeyBytes, err = base64.StdEncoding.DecodeString(
		"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAELNzMVTtn6r5syL6WP/8TYUninUAKki/priUjav/RQUaumswozk8T8cr5Or9SENaevDqHK8xxRaWvQAMqnl/NIQ==",
	)
	if err != nil {
		fmt.Println("Unable to load xoxopper public key")
	} else {
		xoxopperKeyInterface, err := x509.ParsePKIXPublicKey(xoxopperPubKeyBytes)
		if err != nil {
			fmt.Println("public key parse error", http.StatusInternalServerError)
			return
		}

		xoxopperPubKey, ok := xoxopperKeyInterface.(*ecdsa.PublicKey)
		if !ok || xoxopperPubKey.Curve != elliptic.P256() {
			fmt.Println("invalid public key type", http.StatusInternalServerError)
			return
		}

		users = append(users, User{
			Name:      "xoxopper",
			PublicKey: xoxopperPubKey,
		})
	}

	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		_, err := fmt.Fprintln(w, "pong")
		if err != nil {
			return
		}
	})

	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/validate", validateHandler)

	fmt.Println("Server is running on port 80...")
	err = http.ListenAndServe(":80", nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
