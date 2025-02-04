package filestore

import (
	"context"
	"errors"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"io"
	"net/url"
	"time"
)

const (
	defaultBucket = "invoices"
)

type Client struct {
	minioClient *minio.Client
	bucket      string

	logger *zap.Logger
}

func NewClient(config *viper.Viper, logger *zap.Logger) (*Client, error) {
	var err error
	var requiredConfig = []string{"MINIO_ENDPOINT", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"}
	for _, key := range requiredConfig {
		if !config.IsSet(key) {
			logger.Error("missing required config for filestore client", zap.String("config", key))
			err = errors.New("missing required config for filestore client")
		}
	}

	if err != nil {
		return nil, err
	}

	minioClient, err := minio.New(config.GetString("MINIO_ENDPOINT"), &minio.Options{
		Creds:  credentials.NewStaticV4(config.GetString("MINIO_ACCESS_KEY"), config.GetString("MINIO_SECRET_KEY"), ""),
		Secure: false,
	})
	if err != nil {
		logger.Error("failed to create minio client", zap.Error(err))
		return nil, err
	}

	bucket := config.GetString("MINIO_BUCKET")
	if bucket == "" {
		bucket = defaultBucket
	}

	return &Client{
		minioClient: minioClient,
		bucket:      bucket,
		logger:      logger,
	}, nil
}

func (c *Client) GetFileLink(ctx context.Context, object string) (*url.URL, error) {
	return c.minioClient.PresignedGetObject(ctx, c.bucket, object, time.Minute*10, nil)
}

func (c *Client) PutFile(ctx context.Context, object string, reader io.Reader) error {
	_, err := c.minioClient.PutObject(ctx, c.bucket, object, reader, -1, minio.PutObjectOptions{
		ContentType: "application/pdf",
	})

	if err == nil {
		c.logger.Info("file uploaded to file storage", zap.String("object", object))
	}

	return err
}

func (c *Client) GetBucketFilenames(ctx context.Context) (filenames map[string]struct{}, err error) {
	objectsChannel := c.minioClient.ListObjects(ctx, c.bucket, minio.ListObjectsOptions{})
	filenames = make(map[string]struct{})
	for object := range objectsChannel {
		if object.Err != nil {
			err = object.Err
			continue
		}
		filenames[object.Key] = struct{}{}
	}
	return
}
