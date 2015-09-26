<?php


$ds         = DIRECTORY_SEPARATOR;
$path       = 'uploaded';
$uploadFile = $path.$ds.$_GET['hash'].'.mm';
$cacheFile  = $path.$ds.$_GET['hash'].'.json';

unlink($uploadFile);
unlink($cacheFile);