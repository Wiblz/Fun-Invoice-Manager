package filestore

import (
	"context"
	"errors"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/spf13/viper"
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
		Secure: true,
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
