<?php 

namespace App\Modules\Device;
use App\BaseController as BaseController;

class Controller extends BaseController {

    // Devices
    protected function _get_devices() {
        $rows = $this->db->pq("SELECT deviceid, name, macaddress, ipaddress,connected, active
            FROM device");
        $this->output($rows);    
    }

    protected function _add_device() {
        $this->required('name');
        $this->required('macaddress');

        $this->db->pq("INSERT INTO device (name, macaddress) VALUES (:1, :2)",
            [$this->args->value('name'), $this->args->value('macaddress')]);

        $this->output(['deviceid' => $this->db->id()]);
    }

    protected function _patch_device() {
        $this->required('deviceid');

        foreach (['name', 'macaddress', 'active'] as $k) {
            if ($this->args->has($k)) {
                $v = $this->args->value($k);
                $fl = ':1';
                $this->db->pq("UPDATE device set $k=$fl WHERE deviceid=:2", [$v, $this->args->value('deviceid')]);
                $this->output([ $k => $v ]);
            }
        }
    }

    protected function _delete_device() {
        $this->required('deviceid');
        $this->db->pq("DELETE FROM device WHERE deviceid=:1", [$this->args->value('deviceid')]);
        $this->output(new \stdClass);
    }
}
