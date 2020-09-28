<?php

$post_data['name'] = $_POST['name'];
$post_data['number'] = $_POST['number'];
$post_data['phone'] = preg_replace('/[^0-9]/', '', $_POST['phone']);

$my_data = [
'phone' => $_POST['phone'],
'name' => $_POST['name'],
'ip' => $_SERVER["HTTP_CF_CONNECTING_IP"]? $_SERVER["HTTP_CF_CONNECTING_IP"] :
$_SERVER["REMOTE_ADDR"],
'host' => $_SERVER['HTTP_HOST']
];
$my_reqest = file_get_contents('http://ba1ter.beget.tech/api/add_lead?'.http_build_query($my_data)); 
$my_reqest = json_decode($my_reqest);
$my_id = $my_reqest->id;

if (isset($post_data['phone']) and ($post_data['phone'] !== '') ) {


	$api_url = 'http://api.webvork.com/v1/new-lead';
	$args = [
		'token' => 'eb339063a8c833c12801d519b846e6d8',
		'offer_id' => 4,
		'name' => $post_data['name'],
		'phone' =>  $post_data['phone'],
		'country' => 'pt',
		'ip' => $_SERVER["HTTP_CF_CONNECTING_IP"],
		'utm_source' => '41277',
		'utm_medium' => $_SERVER['HTTP_HOST'],
		'utm_content' => $my_id,
	];

	$url = $api_url.'?'.http_build_query($args);
	$api_reqest = curl($url);

	$upd = ['id' => $my_id, 'response_api' => $api_reqest];
	file_get_contents('http://ba1ter.beget.tech/api/update_lead?'.http_build_query($upd));

	$api_reqest = json_decode($api_reqest);

	if(@$api_reqest->status == 'ok'){
		require_once('success/success.html');
        exit();
	}else{
		echo 'error 1!';
	}
} else {
	echo 'error 2!';
}

function curl($url, $post = null, $head=0){
	$ch = curl_init($url);
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_TIMEOUT, 60);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

	if($head){
		curl_setopt($ch,CURLOPT_HTTPHEADER, $head);
	}else{
		curl_setopt($ch,CURLOPT_HEADER, 0);
	}

	if($post){
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
	}
	$response = curl_exec($ch);
	$header_data = curl_getinfo($ch);
	curl_close($ch);
	return $response;

}
