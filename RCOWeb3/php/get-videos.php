<?php

$folder = urldecode( $_REQUEST['folder'] );
$path = parse_url($folder, PHP_URL_PATH);
$path = $_SERVER['DOCUMENT_ROOT'] . $path;

$mp4files = glob( $path . '/*.mp4');

$json = array();

foreach($mp4files as $file) {
	$filename = basename($file);
	$title = basename($filename, '.mp4');
	$covername = $title;
	$coverpath = $path . '/covers/' . $covername . '.jpg';
	$webm = $path . '/' . $title . '.webm';
	$ogv = $path . '/' . $title . '.ogv';
	$postroll = false;
	$subtitles = false;

	// get poster file
	if( file_exists($coverpath) ) {
		$cover = $folder .'/covers/' . $covername . '.jpg';
	}
	else {
		$cover = '';
	}


	// get postroll
	if( file_exists($path . '/' . $title . '.txt') ) {
		$postroll = file_get_contents($path . '/' . $title . '.txt');
	}


	// find subtitle files
	$subFiles = glob($path . '/' . $title . '-*.{srt,vtt}', GLOB_BRACE);
	if( count($subFiles) ) {
		$subtitles = array();

		foreach($subFiles as $sf) {
			$ext = pathinfo($sf, PATHINFO_EXTENSION);
			$lang = array_pop(explode('-', basename($sf, '.' . $ext)));
			$subtitles[] = array(
				'file' => $folder . '/' . basename($sf),
				'lang' => trim($lang)
			);
		}
	}


	// determine if the video is available as free download
	if( strpos($filename, 'not free') === false ) {
		$free = true;
	}
	else {
		$free = false;
		$title = str_replace('not free', '', $filename);
	}

	// prepare the item data
	$json[] = array(
		'type' => 'video',
		'title' => $title,
		'mp4' => $folder . '/' . $filename,
		'webm' => file_exists($webm) ? $folder . '/' . basename($webm) : false,
		'ogv' => file_exists($ogv) ? $folder . '/' . basename($ogv) : false,
		'poster' => $cover,
		'free' => $free,
		'postroll' => $postroll,
		'subtitle' => $subtitles
	);
}


$json = json_encode($json);

header('Content-type: application/json; charset=UTF-8');
echo $json;