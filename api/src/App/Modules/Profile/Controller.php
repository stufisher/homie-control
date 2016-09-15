<?php 

namespace App\Modules\Profile;
use App\BaseController as BaseController;

class Controller extends BaseController {

    // Profiles
    protected function _get_profiles() {
        $where = '';
        $args = [];

        if ($this->args->has('propertygroupid')) {
            $where .= ' AND pp.propertygroupid=:1';
            array_push($args, $this->args->value('propertygroupid'));
        }

        $profiles = $this->db->pq("SELECT count(pc.propertyprofilecomponentid) as components,pp.name,pp.propertyprofileid,pg.propertygroupid,pg.name as propertygroup,psg.propertysubgroupid,psg.name as propertysubgroup
            FROM propertyprofile pp
            LEFT OUTER JOIN propertygroup pg ON pg.propertygroupid = pp.propertygroupid
            LEFT OUTER JOIN propertysubgroup psg ON psg.propertysubgroupid = pp.propertysubgroupid
            LEFT OUTER JOIN propertyprofilecomponent pc ON pc.propertyprofileid = pp.propertyprofileid
            WHERE 1=1 $where
            GROUP BY pp.propertyprofileid", $args);
        $this->output($profiles);
    }

    protected function _add_profile() {
        $this->required('name');

        $this->db->pq("INSERT INTO propertyprofile (name, propertygroupid, propertysubgroupid) VALUES (:1, :2, :3)", [$this->args->value('name'), $this->args->value('propertygroupid', null), $this->args->value('propertysubgroupid', null)]);

        $this->output(['propertyprofileid' => $this->db->id()]);
    }

    protected function _patch_profile() {
        $this->required('propertyprofileid');

        if ($this->args->has('value')) {
            $dev = $this->db->pq("SELECT p.devicestring, p.nodestring, p.propertystring 
                FROM property p
                INNER JOIN options o ON o.name = 'profile_exec_property' AND o.value = p.propertyid");
            if (!sizeof($dev)) return;
            $dev = $dev[0];

            if ($this->mqtt->connect()) {
                $topic = $this->settings['homie']['base_topic'].'/'.$dev['devicestring'].'/'.$dev['nodestring'].'/'.$dev['propertystring'];
                $this->mqtt->publish($topic.'/set', $this->args->value('propertyprofileid'));
                $this->mqtt->close();
                $this->output();
            }

        } else {
            foreach (['name', 'propertygroupid', 'propertysubgroupid'] as $k) {
                if ($this->args->has($k)) {
                    $v = $this->args->value($k);
                    $fl = ':1';
                    $this->db->pq("UPDATE propertyprofile set $k=$fl WHERE propertyprofileid=:2", [$v, $this->args->value('propertyprofileid')]);
                    $this->output([ $k => $v ]);    
                }
            }
        }
    }

    protected function _delete_profile() {
        $this->required('propertyprofileid');

        $this->db->pq("DELETE FROM propertyprofile WHERE propertyprofileid=:1", [$this->args->value('propertyprofileid')]);
        $this->output();
    }



    // Profile Components
    protected function _get_profile_components() {
        $where = '';
        $args = array();

        if ($this->args->has('propertyprofileid')) {
            $where = 'WHERE pc.propertyprofileid=:1';
            array_push($args, $this->args->value('propertyprofileid'));
        }

        $comps = $this->db->pq("SELECT pc.propertyprofilecomponentid,pc.propertyprofileid,pc.propertyid,pr.friendlyname as property,pc.value
            FROM propertyprofilecomponent pc
            INNER JOIN propertyprofile p ON p.propertyprofileid = pc.propertyprofileid
            INNER JOIN property pr on pr.propertyid = pc.propertyid
            $where", $args);

        $this->output($comps);
    }

    protected function _add_profile_component($request, $response, $args) {
        $this->required('propertyid');
        $this->required('propertyprofileid');
        $this->required('value');

        $this->db->pq("INSERT INTO propertyprofilecomponent (propertyid, propertyprofileid, value) VALUES (:1, :2, :3)", array($this->args->value('propertyid'), $this->args->value('propertyprofileid'), $this->args->value('value')));

        $this->output(['propertyprofilecomponentid' => $this->db->id()]);
    }

    protected function _delete_profile_component($request, $response, $args) {
        $this->required('propertyprofilecomponentid');

        $this->db->pq("DELETE FROM propertyprofilecomponent WHERE propertyprofilecomponentid=:1", [$this->args->value('propertyprofilecomponentid')]);

        $this->output();
    }

}




