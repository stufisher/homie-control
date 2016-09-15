<?php 

namespace App\Modules\Schedule;
use App\BaseController as BaseController;


class Controller extends BaseController {

    // Schedules
    protected function _get_schedules() {
        $rows = $this->db->pq("SELECT s.propertyid, s.scheduleid, s.name, s.enabled, s.requiredevice, DATE_FORMAT(s.start, '%d/%m') as start, DATE_FORMAT(s.end, '%d/%m') as end, p.friendlyname, p.friendlyname as propertyname, invert
            FROM schedule s
            INNER JOIN property p ON p.propertyid = s.propertyid
            LEFT OUTER JOIN options o ON o.value = p.propertyid AND o.name LIKE '%_property'
            WHERE s.propertyid IS NOT NULL");

        $this->output($rows);
    }

    protected function _add_schedule() {
        $this->required('start');
        $this->required('end');
        $this->required('propertyid');
        $this->required('name');

        $this->db->pq("INSERT schedule (name, start, end, propertyid, requiredevice, invert) 
            VALUES (:1, STR_TO_DATE(:2, '%d/%m/%y'), STR_TO_DATE(:3, '%d/%m/%y'), :4, :5, :6)", 
            [$this->args->value('name'), $this->args->value('start').'/'.date('y'), $this->args->value('end').'/'.date('y'), $this->args->value('propertyid'), $this->args->value('requiredevice', 0), $this->args->value('invert', 0)]);

        $this->output([ 'scheduleid' => $this->db->id() ]);
    }

    protected function _patch_schedule() {
        $this->required('scheduleid');

        foreach (['start', 'end', 'name', 'enabled', 'requiredevice', 'propertyid', 'invert'] as $k) {
            if ($this->args->has($k)) {
                $fl = ':1';
                $v = $this->args->value($k);
                $nv = $v;
                if (in_array($k, ['start', 'end'])) {
                    $fl = "STR_TO_DATE(:1, '%d/%m/%y')";
                    $nv .= '/'.date('y');
                }
                $this->db->pq("UPDATE schedule set $k=$fl WHERE scheduleid=:2", [$nv, $this->args->value('scheduleid')]);
                $this->output([ $k => $v ]);
            }
        }
    }

    protected function _delete_schedule() {
        $this->required('scheduleid');

        $this->db->pq("DELETE FROM schedule WHERE scheduleid = :1", [$this->args->value('scheduleid')]);
        $this->output();
    }



    // Schedules Components
    protected function _get_schedule_components() {
        $where = '';
        $args = [];

        if ($this->args->has('scheduleid')) {
            $where .= ' AND scheduleid=:'.(sizeof($args)+1);
            array_push($args, $this->args->value('scheduleid'));
        }

        $rows = $this->db->pq("SELECT sc.schedulecomponentid, sc.scheduleid, sc.day, DATE_FORMAT(sc.start, '%H:%i') as startt, DATE_FORMAT(sc.end, '%H:%i') as endt, TIME_TO_SEC(TIMEDIFF(sc.end, sc.start))/3600 as length
            FROM schedulecomponent sc
            WHERE 1=1 $where", $args);

        $this->output($rows);
    }

    protected function _add_schedule_component() {
        $this->required('scheduleid');
        $this->required('startt');
        $this->required('endt');
        $this->required('day');

        $this->db->pq("INSERT schedulecomponent (scheduleid, day, start, end) VALUES (:1, :2, :3, :4)", [$this->args->value('scheduleid'), $this->args->value('day'), $this->args->value('startt').':00', $this->args->value('end').':00']);

        $this->output([ 'schedulecomponentid' => $this->db->id() ]);
    }

    protected function _put_schedule_component() {
        $this->required('schedulecomponentid');
        $this->required('startt');
        $this->required('endt');

        $this->db->pq("UPDATE schedulecomponent set start=:1, end=:2 WHERE schedulecomponentid=:3", [$this->args->value('startt').':00', $this->args->value('endt').':00', $this->args->value('schedulecomponentid')]);

        $comp = $this->db->pq("SELECT TIME_TO_SEC(TIMEDIFF(end, start))/3600 as length FROM schedulecomponent WHERE schedulecomponentid=:1", [$this->args->value('schedulecomponentid')]);

        $this->output([ 'length' => $comp[0]['length'] ]);
    }

    protected function _delete_schedule_component() {
        $this->required('schedulecomponentid');

        $this->db->pq("DELETE FROM schedulecomponent WHERE schedulecomponentid = :1", [$this->args->value('schedulecomponentid')]);
        $this->output();
    }

}
