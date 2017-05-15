<?php 

namespace App\Modules\Repeater;
use App\BaseController as BaseController;

class Controller extends BaseController {

    // Repeater
    protected function _get_repeater() {
        $where = '';
        $args = array();

        if ($this->args->has('repeatermapid')) {
            $where .= ' AND p.repeatermapid=:'.(sizeof($args)+1);
            array_push($args, $this->args->value('repeatermapid'));
        }

        if ($this->args->has('s')) {
            $where .= " AND (dp.friendlyname LIKE CONCAT('%',:".(sizeof($args)+1).",'%') OR dp.devicestring LIKE CONCAT('%',:".(sizeof($args)+2).",'%') OR dp.nodestring LIKE CONCAT('%',:".(sizeof($args)+3).",'%') OR dp.propertystring LIKE CONCAT('%',:".(sizeof($args)+4).",'%'))";
            array_push($args, $this->args->value('s'));
            array_push($args, $this->args->value('s'));
            array_push($args, $this->args->value('s'));
            array_push($args, $this->args->value('s'));
        }

        $tot = $this->db->pq("SELECT count(dm.repeaterpropertyid) as tot
            FROM repeatermap dm
            INNER JOIN property dp ON dp.propertyid = dm.repeaterpropertyid
            WHERE 1=1 $where", $args);
        $tot = $tot[0]['tot'];

        $this->_get_start_end($args);

        $rows = $this->db->paginate("SELECT dm.repeatermapid, p.friendlyname as property, dp.friendlyname as repeaterproperty, dm.propertyid, dm.repeaterpropertyid, dm.round, CONCAT(p.devicestring, '/', p.nodestring, '/', p.propertystring) as propertyaddress, CONCAT(dp.devicestring, '/', dp.nodestring, '/', dp.propertystring) as repeateraddress, dm.propertygroupid, dm.propertysubgroupid
            FROM repeatermap dm
            INNER JOIN property dp ON dp.propertyid = dm.repeaterpropertyid
            LEFT OUTER JOIN property p ON p.propertyid = dm.propertyid
            LEFT OUTER JOIN propertygroup pg ON pg.propertygroupid = dm.propertygroupid
            LEFT OUTER JOIN propertysubgroup psg ON psg.propertysubgroupid = dm.propertysubgroupid
            WHERE 1=1 $where", $args);

        if ($this->args->has('repeatermapid')) {
            if(!sizeof($props)) $this->error('No such repeater property');
            else $this->output($props[0]);
        } else $this->output(['total' => $tot, 'data' => $rows]);
    }

    protected function _add_repeater() {
        $this->required('repeaterpropertyid');

        $this->db->pq("INSERT INTO repeatermap (repeaterpropertyid, propertyid, propertygroupid, propertysubgroupid, round) VALUES (:1, :2, :3, :4, :5)",
            [$this->args->value('repeaterpropertyid'), $this->args->value('propertyid'), $this->args->value('propertygroupid'), $this->args->value('propertysubgroupid'), $this->args->value('round', 0)]);

        $this->output(['repeatermapid' => $this->db->id()]);
    }

    protected function _patch_repeater() {
        $this->required('repeatermapid');

        foreach (['propertyid', 'propertygroupid', 'propertysubgroupid', 'round'] as $k) {
            if ($this->args->has($k)) {
                $v = $this->args->value($k);
                $fl = ':1';
                $this->db->pq("UPDATE repeatermap set $k=$fl WHERE repeatermapid=:2", [$v, $this->args->value('repeatermapid')]);
                $this->output([ $k => $v ]);
            }
        }
    }

    protected function _delete_repeater() {
        $this->required('repeatermapid');
        $this->db->pq("DELETE FROM repeatermap WHERE repeatermapid=:1", [$this->args->value('repeatermapid')]);
        $this->output(new \stdClass);
    }
}
