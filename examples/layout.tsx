import React from "react";

function Header() {
    return (
        <header style={{ padding: 16, background: "#f1f1f1" }}>
            <h1>Example App</h1>
        </header>
    );
}

function UserCard() {
    return (
        <section style={{ padding: 16, border: "1px solid #ddd", marginTop: 16 }}>
            <h2>User Card</h2>
            <p>Details about the user.</p>
        </section>
    );
}

function Footer() {
    return (
        <footer style={{ padding: 16, background: "#f9f9f9", marginTop: 32 }}>
            <p>© 2025 Example</p>
        </footer>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Header />
                <main>
                    <UserCard />
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}


