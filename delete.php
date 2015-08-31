<?php
	$uploadPath   = 'upload/';
	$uploadFile = $uploadPath.$_GET['hash'].'.mm';
	$cachePath   = 'content/';
	$cacheFile = $cachePath.$_GET['hash'].'.json';

  unlink($uploadFile);
  unlink($cacheFile);