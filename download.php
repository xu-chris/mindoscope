<?php
  $ds   = DIRECTORY_SEPARATOR;
	$path   = 'uploaded';
	$filepath = $path.$ds.$_GET['hash'].'.mm';
	header("Content-Type: application/octet-stream");
	header("Content-Disposition: attachment; filename=mindmap.mm");
	readfile($filepath);
?>