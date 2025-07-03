package main

import (
    "fmt"
    "net/http"
    "os"
)

type Page struct {
    Title string
    Body  []byte
}

func loadPage(filename string) (*Page, error) {
    body, err := os.ReadFile(filename)
    if err != nil {
        return nil, err
    }
    return &Page{Title: filename, Body: body}, nil
}


func main() {
    http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "pong")
    })

    http.Handle("/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

    fmt.Println("Server is running on port 80...")
    err := http.ListenAndServe(":80", nil)
    if err != nil {
        fmt.Println("Error starting server:", err)
    }
}

