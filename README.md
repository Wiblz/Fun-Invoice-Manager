# Setup

## Setting up development storage server
In order to run the application, a MinIO server must be set up.  
- Run a docker container with a MinIO server:
```
mkdir -p ${HOME}/minio/data

docker run \
   -p 9000:9000 \
   -p 9001:9001 \
   --user $(id -u):$(id -g) \
   --name minio1 \
   -e "MINIO_ROOT_USER=ROOTUSER" \
   -e "MINIO_ROOT_PASSWORD=CHANGEME123" \
   -v ${HOME}/minio/data:/data \
   quay.io/minio/minio server /data --console-address ":9001"
```
- Log in to the MinIO server at http://localhost:9000 with the credentials `ROOTUSER` and `CHANGEME123`.
- Generate a new access key and secret key in the MinIO server console. They will be used as the `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` environment variables.
- Create a new bucket named `invoices` (or any other name, but make sure to set the `MINIO_BUCKET` environment variable accordingly).

## Backend
- Clone the repository:  
`git clone https://github.com/Wiblz/Fun-Invoice-Manager.git`  
`cd Fun-Invoice-Manager`
- Install Go dependencies:  
`go mod tidy`  
- Set up environment variables:  
Create a `.env` file in the `backend` directory with the following variables set:  
  - `SQLITE_FILE` - SQLite database filename, defaults to `invoice.db`
  - `LOG_PATH` - Log file path, defaults to `../logs/invoice.log` (relative to the `backend` directory)
  - `MINIO_ENDPOINT` - MinIO server endpoint, must be set
  - `MINIO_ACCESS_KEY` - MinIO server access key, must be set.
  - `MINIO_SECRET_KEY` - MinIO server secret key, must be set
  - `MINIO_BUCKET` - Storage bucket name, defaults to `invoices`
  - `PRODUCTION` - Set to `true` to enable production mode, defaults to `false`
- Run the backend server:  
  `go run backend/api/server.go`

## Frontend
- Navigate to the frontend directory:  
  `cd frontend/my-app`
- Install Node.js dependencies:  
  `npm install`
- Run the frontend development server:  
  `npm run dev`

## Usage
  The backend server will be running at http://localhost:8080.  
  The frontend development server will be running at http://localhost:3000.

# Development thoughts
Thoughts and considerations during the development process can be found [[here](https://github.com/Wiblz/Fun-Invoice-Manager/blob/main/docs/README.md)].

# TODO
## Backend
- [x] Extract raw text from PDF files
- [x] Add logs and log rotation
- [ ] Dockerize the backend server
- [ ] Research a way to automate the file storage setup
## Frontend
- [ ] Validate file upload form
- [x] Style toasts and add more detailed messages
