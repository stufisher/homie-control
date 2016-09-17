<?php 

namespace App\Modules\Trigger;
use App\BaseController as BaseController;

class Controller extends BaseController {

    // Property Triggers
    protected function _get_ptriggers() {
        $rows = $this->db->pq("SELECT pt.propertytriggerid, pt.propertyid, pt.value, pt.comparator, pt.propertyprofileid, pt.scheduleid, pt.schedulestatus, pt.active, p.friendlyname as propertyname, pp.name as propertyprofile, s.name as schedule, email, delay
            FROM propertytrigger pt
            INNER JOIN property p ON pt.propertyid = p.propertyid
            LEFT OUTER JOIN propertyprofile pp ON pp.propertyprofileid = pt.propertyprofileid
            LEFT OUTER JOIN schedule s ON s.scheduleid = pt.scheduleid");
        $this->output($rows); 
    }

    protected function _add_ptrigger() {
        $this->required('propertyid');
        $this->required('value');
        $this->required('comparator');

        $this->db->pq("INSERT INTO propertytrigger (propertyid, value, comparator, propertyprofileid, scheduleid, schedulestatus, email, delay) 
            VALUES (:1, :2, :3, :4, :5, :6, :7, :8)",
            [$this->args->value('propertyid'), $this->args->value('value'), $this->args->value('comparator'), $this->args->value('propertyprofileid', null), $this->args->value('scheduleid', null), $this->args->value('schedulestatus', null), $this->args->value('email', 0), $this->args->value('delay', 0)]);

        $this->output(['propertytriggerid' => $this->db->id()]);
    }

    protected function _patch_ptrigger() {
        $this->required('propertytriggerid');

        foreach (['propertyid' => false, 'value' => false, 'comparator' => false, 'propertyprofileid' => true, 'scheduleid' => true, 'schedulestatus' => true, 'active' => false, 'email' => false, 'delay' => true] as $k => $empty) {
            if ($this->args->has($k, $empty)) {
                $v = $this->args->value($k);
                $fl = ':1';

                $this->db->pq("UPDATE propertytrigger set $k=$fl WHERE propertytriggerid=:2", [$v, $this->args->value('propertytriggerid')]);
                $this->output([ $k => $v ]);    
            }
        }
    }

    protected function _delete_ptrigger() {
        $this->required('propertytriggerid');
        $this->db->pq("DELETE FROM propertytrigger WHERE propertytriggerid=:1", [$this->args->value('propertytriggerid')]);
        $this->output();
    }



    // Sun Triggers
    protected function _get_striggers() {
        $rows = $this->db->pq("SELECT t.suntriggerid, t.propertyprofileid, t.requiredevice, t.sunset, t.active, pp.name as propertyprofile
            FROM suntrigger t
            INNER JOIN propertyprofile pp ON pp.propertyprofileid = t.propertyprofileid");
        $this->output($rows); 
    }

    protected function _add_strigger() {
        $this->required('sunset');
        $this->required('requiredevice');
        $this->required('propertyprofileid');

        $this->db->pq("INSERT INTO suntrigger (sunset, requiredevice, propertyprofileid) 
            VALUES (:1, :2, :3)",
            [$this->args->value('sunset'), $this->args->value('requiredevice'), $this->args->value('propertyprofileid')]);

        $this->output(['suntriggerid' => $this->db->id()]);
    }

    protected function _patch_strigger() {
        $this->required('suntriggerid');

        foreach (['sunset', 'requiredevice', 'propertyprofileid', 'active'] as $k) {
            if ($this->args->has($k)) {
                $v = $this->args->value($k);
                $fl = ':1';

                $this->db->pq("UPDATE suntrigger set $k=$fl WHERE suntriggerid=:2", [$v, $this->args->value('suntriggerid')]);
                $this->output([ $k => $v ]);
            }
        }
    }

    protected function _delete_strigger() {
        $this->required('suntriggerid');
        $this->db->pq("DELETE FROM suntrigger WHERE suntriggerid=:1", [$this->args->value('suntriggerid')]);
        $this->output();
    }



    // Device Triggers
    protected function _get_dtriggers() {
        $rows = $this->db->pq("SELECT t.devicetriggerid, t.deviceid, t.requiresunset, t.requirelast, t.active, t.connected, t.propertyprofileid
            FROM devicetrigger t
            LEFT OUTER JOIN device d ON d.deviceid = t.deviceid");
        $this->output($rows); 
    }


    protected function _add_dtrigger() {
        $this->required('connected');
        $this->required('requiresunset');
        $this->required('requirelast');
        $this->required('propertyprofileid');

        $this->db->pq("INSERT INTO devicetrigger (connected, deviceid, requiresunset, requirelast, propertyprofileid) 
            VALUES (:1, :2, :3, :4, :5)",
            [$this->args->value('connected'), $this->args->value('deviceid'), $this->args->value('requiresunset'), $this->args->value('requirelast'), $this->args->value('propertyprofileid')]);

        $this->output(['devicetriggerid' => $this->db->id()]);
    }

    protected function _patch_dtrigger() {
        $this->required('devicetriggerid');
        
        foreach (['connected' => false, 'deviceid' => true, 'requiresunset' => false, 'requirelast' => false, 'propertyprofileid' => false, 'active'  => false] as $k => $empty) {
            if ($this->args->has($k, $empty)) {
                $v = $this->args->value($k);
                $fl = ':1';

                $this->db->pq("UPDATE devicetrigger set $k=$fl WHERE devicetriggerid=:2", [$v, $this->args->value('devicetriggerid')]);
                $this->output([ $k => $v ]);    
            }
        }
    }

    protected function _delete_dtrigger() {
        $this->required('devicetriggerid');
        $this->db->pq("DELETE FROM devicetrigger WHERE devicetriggerid=:1", [$this->args->value('devicetriggerid')]);
        $this->output();
    }
}
