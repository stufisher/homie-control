<?php 

namespace App\Modules\Admin;
use App\BaseController as BaseController;

class Controller extends BaseController {

    # For this to work www-data needs to be added to the list of groups that can manage networks
    # There are significant security implications to this
    # see policykit/x.NetworkManager.pkla

    var $nmcli = '/usr/bin/nmcli';
    var $baseid = 'HA-';
    var $baseip = '192.168.123.1';


    // Scan for SSIDs of Homie devices
    protected function _scan_devices() {
        $if = $this->db->pq("SELECT value FROM options WHERE name='scan_interface'");
        if (!sizeof($if)) $this->error('No scan interface defined');
        $if = $if[0]['value'];

        $res = [];
        $devices = [];
        exec($this->nmcli.' dev wifi rescan ifname '.escapeshellarg($if).' 2>&1');
        exec($this->nmcli.' dev wifi list ifname '.escapeshellarg($if).' 2>&1', $res);

        array_shift($res);
        foreach ($res as $r) {
            $parts = preg_split('/\s+/', $r);
            if (substr($parts[1], 0, strlen($this->baseid)) === $this->baseid) {
                array_push($devices, [
                    'ssid' => $parts[1],
                    'chan' => $parts[3],
                    'signal' => $parts[6],
                ]);
            }
        }

        $this->output($devices);
    }


    protected function _device_info() {
        $this->required('ssid');

        $this->_create_connection(['ssid' => $this->args->value('ssid')]);
        $info = $this->_curl(['path' => 'device-info']);
        $this->_delete_connection(['ssid' => $this->args->value('ssid')]);

        $this->output($info);
    }


    protected function _device_configure() {
        $this->required('ssid');
        $this->required('name');

        $this->_create_connection(['ssid' => $this->args->value('ssid')]);

        $resp = $this->_curl([
        // print_r([
            'path' => 'config',
            'method' => 'PUT',
            'data' => [
                'mqtt' => [
                    'base_topic' => $this->settings['homie']['base_topic'].'/',
                    'host' => $this->settings['mqtt']['device_server'],
                    'port' => 1883,
                    'ssl' => false,
                    'auth' => true,
                    'password' => $this->settings['mqtt']['device_password'],
                    'username' => $this->settings['mqtt']['device_user']
                ],
                'name' => $this->args->value('name'),
                'ota' => [
                    'enabled' => false
                ],
                'wifi' => [
                    'password' => $this->settings['wifi']['password'],
                    'ssid' => $this->settings['wifi']['ssid']
                ]
            ]
        ]);

        $this->_delete_connection(['ssid' => $this->args->value('ssid')]);

        $this->output($resp);
    }


    private function _create_connection($options) {
        $if = $this->db->pq("SELECT value FROM options WHERE name='scan_interface'");
        if (!sizeof($if)) $this->error('No scan interface defined');
        $if = $if[0]['value'];

        $pass = str_replace($this->baseid, '', $options['ssid']);

        $res = [];
        exec($this->nmcli.' dev wifi connect '.escapeshellarg($options['ssid']).' password '.escapeshellarg($pass).' ifname '.escapeshellarg($if), $res);
    }

    private function _delete_connection($options) {
        $id = str_replace($this->baseid, '', $options['ssid']);

        $res = [];
        exec($this->nmcli.' c s', $res);

        array_shift($res);
        if (sizeof($res) > 1) {
            foreach ($res as $r) {
                $parts = preg_split('/\s\s+/', $r);
                if (preg_match('/^'.$this->baseid.$id.'/', $parts[0])) {
                    exec($this->nmcli.' connection delete id '.escapeshellarg($parts[0]));
                }
            }
        }

        
    }


    private function _curl($options) {
        $curl = \curl_init('http://'.$this->baseip.'/'.$options['path']);
        \curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        \curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 5); 
        \curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));

        if ($options['method']) \curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $options['method']);
        if ($options['data']) \curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($options['data']));

        $curl_response = \curl_exec($curl);
        if ($curl_response === false) {
            $err = curl_error($curl);
            \curl_close($curl);
            $this->error('Curl request failed'.$err);
        }
        \curl_close($curl);
        return $curl_response ? json_decode($curl_response) : null;
    }


}
