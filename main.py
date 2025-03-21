""" Main to run server of website """
from website import create_app, db

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
