package filestore

import (
	"context"
	"errors"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/spf13/viper"
	"io"
	"net/url"
	"time"
)

type Client struct {
	minioClient *minio.Client
	bucket      string
}

func NewClient(config *viper.Viper) (*Client, error) {
	if !config.IsSet("MINIO_ENDPOINT") ||
		!config.IsSet("MINIO_ACCESS_KEY") ||
		!config.IsSet("MINIO_SECRET_KEY") ||
		!config.IsSet("MINIO_BUCKET") {
		return nil, errors.New("missing required config for filestore client")
	}

	minioClient, err := minio.New(config.GetString("MINIO_ENDPOINT"), &minio.Options{
		Creds:  credentials.NewStaticV4(config.GetString("MINIO_ACCESS_KEY"), config.GetString("MINIO_SECRET_KEY"), ""),
		Secure: false,
	})
	if err != nil {
		return nil, err
	}

	return &Client{
		minioClient: minioClient,
		bucket:      config.GetString("MINIO_BUCKET"),
	}, nil
}

func (c *Client) GetFileLink(ctx context.Context, object string) (*url.URL, error) {
	return c.minioClient.PresignedGetObject(ctx, c.bucket, object, time.Minute*10, nil)
}

func (c *Client) PutFile(ctx context.Context, object string, reader io.Reader) error {
	_, err := c.minioClient.PutObject(ctx, c.bucket, object, reader, -1, minio.PutObjectOptions{})
	return err
}

func (c *Client) GetBucketFilenames(ctx context.Context) (filenames map[string]struct{}, err error) {
	objectsChannel := c.minioClient.ListObjects(ctx, c.bucket, minio.ListObjectsOptions{})
	filenames = make(map[string]struct{})
	for object := range objectsChannel {
		filenames[object.Key] = struct{}{}
	}
	return
}
