process.env.NODE_ENV = 'test'

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

let testBook1;
let testBook2;

beforeEach(async () => {
    /*
    Adds sample data to test. 
    */

    const result1 = await db.query(
        `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES('0691161518', 'http://a.co/eobPtX2', 'Matthew Lane', 'english', 264, 'Princeton University Press', 'Power-Up: Unlocking the Hidden Mathematics in Video Games', 2017)
        RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`
    )

    const result2 = await db.query(
        `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES('06911615184444', 'http://aksjnfkasfdasdf.com', 'JK Rowling', 'english', 1000, 'London Press', 'Harry Potter & The Chamber of Secrets', 2017)
        RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`
    )

    testBook1 = result1.rows[0]
    testBook2 = result2.rows[0]
})

afterEach(async () => {
    /*
    Deletes all tables in database. 
    */
    await db.query(`DELETE FROM books`)
})

afterAll(async() => {
    /* 
    Ends connection to database.
    */
    await db.end()
})

describe("Test 404 request of /", () => {
    test("Test 404 error on /", async () => {
        const res = await request(app).get('/')

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({ error: { message: 'Not Found', status: 404 } })
    })
})

describe("GET /books", () => {
    test("Get all books", async () => {
        const res = await request(app).get('/books')
    
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ books: [
            {
                isbn: testBook2.isbn,
                amazon_url: testBook2.amazon_url,
                author: testBook2.author,
                language: testBook2.language,
                pages: testBook2.pages,
                publisher: testBook2.publisher,
                title: testBook2.title,
                year: testBook2.year
            },
            {
                isbn: testBook1.isbn,
                amazon_url: testBook1.amazon_url,
                author: testBook1.author,
                language: testBook1.language,
                pages: testBook1.pages,
                publisher: testBook1.publisher,
                title: testBook1.title,
                year: testBook1.year
            }
        ]})
    })
})

describe("GET /books/:id", () => {
    test("Get individual book", async () => {
        const res = await request(app).get(`/books/${testBook1.isbn}`)
    
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ book:
            {
                isbn: testBook1.isbn,
                amazon_url: testBook1.amazon_url,
                author: testBook1.author,
                language: testBook1.language,
                pages: testBook1.pages,
                publisher: testBook1.publisher,
                title: testBook1.title,
                year: testBook1.year
            }
        })
    })

    test("Test invalid book resulting in 404 error", async () => {
        const res = await request(app).get('/books/0')

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({ error: { message: "There is no book with an isbn '0", status: 404 } })
    })
})

describe("POST /books", () => {
    test("Create Book", async () => {
        const res = await request(app).post(`/books`).send({
            isbn: "92314",
            amazon_url: "http://test.com",
            author: "test",
            language: "english",
            pages: 236,
            publisher: "test",
            title: "test",
            year: 2023
        })
    
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ book: {
                isbn: "92314",
                amazon_url: "http://test.com",
                author: "test",
                language: "english",
                pages: 236,
                publisher: "test",
                title: "test",
                year: 2023
            }
        })
    })

    test("Test invalid post request with missing data", async () => {
        const res = await request(app).post("/books").send({
            isbn: "92314",
            amazon_url: "http://test.com",
            author: "test",
            language: "english",
            pages: 236
        })

        expect(res.statusCode).toBe(400)
        expect(res.body.error).toEqual({
            message: [
                'instance requires property "publisher"',
                'instance requires property "title"',
                'instance requires property "year"'
            ],
            status: 400
        })
    })

    test("Test invalid url format", async () => {
        const res = await request(app).post("/books").send({
            isbn: "92314",
            amazon_url: "askdfnasdfna",
            author: "test",
            language: "english",
            pages: 236,
            publisher: "test",
            title: "test",
            year: 2023
        })

        expect(res.statusCode).toBe(400)
        expect(res.body.error).toEqual({
            message: [
                'instance.amazon_url does not conform to the "uri" format'
            ],
            status: 400
        })
    })
})

describe("PUT /books/:isbn", () => {
    test("Update Book", async () => {
        const res = await request(app).put(`/books/${testBook1.isbn}`).send({
            isbn: testBook1.isbn,
            amazon_url: "http://test.com",
            author: "UPDATING AUTHOR",
            language: "english",
            pages: 500,
            publisher: "test",
            title: "test",
            year: 2222
        })
    
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ book: {
                isbn: testBook1.isbn,
                amazon_url: "http://test.com",
                author: "UPDATING AUTHOR",
                language: "english",
                pages: 500,
                publisher: "test",
                title: "test",
                year: 2222
            }
        })
    })

    test("Update Book with Invalid Field. Will ignore invalid field", async () => {
        const res = await request(app).put(`/books/${testBook1.isbn}`).send({
            isbn: testBook1.isbn,
            amazon_url: "http://test.com",
            invalid_field: "INVALID FIELD",
            author: "UPDATING AUTHOR",
            language: "english",
            pages: 500,
            publisher: "test",
            title: "test",
            year: 2222
        })
    
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ book: {
                isbn: testBook1.isbn,
                amazon_url: "http://test.com",
                author: "UPDATING AUTHOR",
                language: "english",
                pages: 500,
                publisher: "test",
                title: "test",
                year: 2222
            }
        })
    })

    test("Test invalid book resulting in 404 error", async () => {
        const res = await request(app).put('/books/0')

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({ error: { message: "There is no book with an isbn '0", status: 404 } })
    })

    test("Test invalid url format", async () => {
        const res = await request(app).put(`/books/${testBook1.isbn}`).send({
            isbn: "92314",
            amazon_url: "askdfnasdfna",
            author: "UPDATE TEST",
            language: "english",
            pages: 236,
            publisher: "test",
            title: "test",
            year: 2023
        })

        expect(res.statusCode).toBe(400)
        expect(res.body.error).toEqual({
            message: [
                'instance.amazon_url does not conform to the "uri" format'
            ],
            status: 400
        })
    })
})

describe("DELETE /books/:isbn", () => {
    test("Delete Book", async () => {
        const res = await request(app).delete(`/books/${testBook1.isbn}`)
    
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ message: "Book deleted" })
    })

    test("Test invalid book resulting in 404 error", async () => {
        const res = await request(app).delete('/books/0')

        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({ error: { message: "There is no book with an isbn '0", status: 404 } })
    })
})


