<?php
	$uploadPath   = 'upload/';
	$filepath = $uploadPath.$_GET['hash'].'.mm';
	header("Content-Type: application/octet-stream");
	header("Content-Disposition: attachment; filename=mindmap.mm");
	readfile($filepath);
?>